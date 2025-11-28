const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { authenticateToken } = require('../middleware/auth');

// Generate unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create a new room
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, maxPlayers, rounds, drawTime, settings } = req.body;

    // Generate unique room code
    let code;
    let attempts = 0;
    do {
      code = generateRoomCode();
      attempts++;
      if (attempts > 10) {
        return res.status(500).json({ error: 'Failed to generate unique room code' });
      }
    } while (await Room.findOne({ code }));

    // Create room
    const room = new Room({
      name: name || `Room ${code}`,
      code,
      host: req.user.id,
      maxPlayers: maxPlayers || 8,
      rounds: rounds || 3,
      drawTime: drawTime || 60,
      settings: settings || {}
    });

    await room.save();

    res.status(201).json({
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        maxPlayers: room.maxPlayers,
        rounds: room.rounds,
        drawTime: room.drawTime,
        status: room.status
      }
    });

  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room details
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const room = await Room.findOne({ code: code.toUpperCase() })
      .populate('host', 'username')
      .populate('players.user', 'username');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Don't send current word if game is in progress
    const roomData = {
      id: room._id,
      name: room.name,
      code: room.code,
      host: room.host,
      players: room.players,
      playerCount: room.playerCount,
      maxPlayers: room.maxPlayers,
      rounds: room.rounds,
      drawTime: room.drawTime,
      status: room.status,
      currentRound: room.currentRound,
      currentDrawer: room.currentDrawer,
      timeLeft: room.timeLeft,
      settings: room.settings,
      createdAt: room.createdAt
    };

    // Hide current word from non-drawers during gameplay
    if (room.status === 'playing') {
      roomData.currentWord = null; // Will be sent separately to drawer
    } else {
      roomData.currentWord = room.currentWord;
    }

    res.json({ room: roomData });

  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room details' });
  }
});

// Join room
router.post('/:code/join', async (req, res) => {
  try {
    const { code } = req.params;
    const { username, avatar } = req.body;

    if (!username || username.trim().length === 0) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const room = await Room.findOne({ code: code.toUpperCase() });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Room is not accepting new players' });
    }

    if (room.playerCount >= room.maxPlayers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Check if username is already taken in this room
    const existingPlayer = room.players.find(p => p.username === username.trim());
    if (existingPlayer) {
      return res.status(400).json({ error: 'Username already taken in this room' });
    }

    // Add player to room
    room.players.push({
      username: username.trim(),
      avatar: avatar || 0,
      score: 0,
      isConnected: true
    });

    room.playerCount = room.players.length;
    await room.save();

    res.json({
      message: 'Joined room successfully',
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        players: room.players,
        playerCount: room.playerCount,
        maxPlayers: room.maxPlayers
      }
    });

  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Leave room
router.post('/:code/leave', async (req, res) => {
  try {
    const { code } = req.params;
    const { username } = req.body;

    const room = await Room.findOne({ code: code.toUpperCase() });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Find and remove player
    const playerIndex = room.players.findIndex(p => p.username === username);
    if (playerIndex === -1) {
      return res.status(404).json({ error: 'Player not found in room' });
    }

    room.players.splice(playerIndex, 1);
    room.playerCount = room.players.length;

    // If room is empty, delete it
    if (room.players.length === 0) {
      await Room.findByIdAndDelete(room._id);
      return res.json({ message: 'Room deleted - no players remaining' });
    }

    // If host left, assign new host
    const hostLeft = room.players.every(p => p.user?.toString() !== room.host.toString());
    if (hostLeft && room.players.length > 0) {
      room.host = room.players[0].user;
    }

    await room.save();

    res.json({ message: 'Left room successfully' });

  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
});

// Get public rooms list
router.get('/', async (req, res) => {
  try {
    const { status = 'waiting', limit = 20 } = req.query;

    const rooms = await Room.find({ status })
      .populate('host', 'username')
      .select('name code playerCount maxPlayers rounds drawTime status createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ rooms });

  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Failed to get rooms' });
  }
});

// Update room settings (host only)
router.put('/:code', authenticateToken, async (req, res) => {
  try {
    const { code } = req.params;
    const updates = req.body;

    const room = await Room.findOne({ code: code.toUpperCase() });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is host
    if (room.host.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only room host can update settings' });
    }

    // Prevent updates during gameplay
    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Cannot update room settings during gameplay' });
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'maxPlayers', 'rounds', 'drawTime', 'settings'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        room[field] = updates[field];
      }
    });

    await room.save();

    res.json({
      message: 'Room updated successfully',
      room: {
        id: room._id,
        name: room.name,
        code: room.code,
        maxPlayers: room.maxPlayers,
        rounds: room.rounds,
        drawTime: room.drawTime,
        settings: room.settings
      }
    });

  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

module.exports = router;
