const Room = require('../models/Room');
const Message = require('../models/Message');

// Store active rooms and their data
const activeRooms = new Map();

function handleSocketConnection(socket, io) {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', async (data) => {
    try {
      const { roomCode, username, avatar } = data;

      socket.join(roomCode);
      console.log(`${username} joined room ${roomCode}`);

      // Get room data
      const room = await Room.findOne({ code: roomCode.toUpperCase() });
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Initialize room data if not exists
      if (!activeRooms.has(roomCode)) {
        activeRooms.set(roomCode, {
          players: new Map(),
          messages: [],
          currentDrawer: null,
          currentWord: null,
          timeLeft: room.drawTime,
          gameState: 'waiting'
        });
      }

      const roomData = activeRooms.get(roomCode);

      // Add player to room data
      roomData.players.set(socket.id, {
        id: socket.id,
        username,
        avatar: avatar || 0,
        score: 0,
        isDrawer: false
      });

      // Update player count in database
      await Room.findByIdAndUpdate(room._id, {
        $inc: { playerCount: 1 }
      });

      // Send current room state to new player
      socket.emit('room-joined', {
        room: {
          id: room._id,
          name: room.name,
          code: room.code,
          players: Array.from(roomData.players.values()),
          messages: roomData.messages,
          currentDrawer: roomData.currentDrawer,
          timeLeft: roomData.timeLeft,
          gameState: roomData.gameState
        }
      });

      // Notify other players
      socket.to(roomCode).emit('player-joined', {
        player: roomData.players.get(socket.id)
      });

    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('leave-room', async (data) => {
    try {
      const { roomCode } = data;

      console.log(`User ${socket.id} left room ${roomCode}`);

      if (activeRooms.has(roomCode)) {
        const roomData = activeRooms.get(roomCode);
        roomData.players.delete(socket.id);

        // If no players left, clean up
        if (roomData.players.size === 0) {
          activeRooms.delete(roomCode);
        } else {
          // Notify remaining players
          socket.to(roomCode).emit('player-left', { playerId: socket.id });
        }
      }

      socket.leave(roomCode);

      // Update database
      const room = await Room.findOne({ code: roomCode.toUpperCase() });
      if (room) {
        await Room.findByIdAndUpdate(room._id, {
          $inc: { playerCount: -1 }
        });
      }

    } catch (error) {
      console.error('Leave room error:', error);
    }
  });

  // Handle drawing
  socket.on('draw', (data) => {
    const { roomCode, drawingData } = data;
    // Broadcast drawing data to other players in the room
    socket.to(roomCode).emit('drawing-update', {
      playerId: socket.id,
      drawingData
    });
  });

  // Handle chat messages
  socket.on('send-message', async (data) => {
    try {
      const { roomCode, message, username } = data;

      if (!activeRooms.has(roomCode)) return;

      const roomData = activeRooms.get(roomCode);
      const player = roomData.players.get(socket.id);

      if (!player) return;

      // Check if message is the correct word
      let isCorrect = false;
      if (roomData.currentWord &&
          message.toLowerCase().trim() === roomData.currentWord.toLowerCase()) {
        isCorrect = true;

        // Update player score
        player.score += Math.max(50, roomData.timeLeft * 2);

        // Move to next round or end game
        await handleCorrectGuess(roomCode, socket.id, io);
      }

      const messageData = {
        id: Date.now(),
        username: player.username,
        message,
        timestamp: new Date(),
        isCorrect
      };

      // Save message to database
      const newMessage = new Message({
        room: roomCode,
        player: socket.id,
        username: player.username,
        message,
        isCorrect,
        timestamp: new Date()
      });
      await newMessage.save();

      // Add to room messages
      roomData.messages.push(messageData);

      // Keep only last 50 messages
      if (roomData.messages.length > 50) {
        roomData.messages = roomData.messages.slice(-50);
      }

      // Broadcast message to all players in room
      io.to(roomCode).emit('message', messageData);

    } catch (error) {
      console.error('Send message error:', error);
    }
  });

  // Start game
  socket.on('start-game', async (data) => {
    try {
      const { roomCode } = data;

      if (!activeRooms.has(roomCode)) return;

      const roomData = activeRooms.get(roomCode);
      const players = Array.from(roomData.players.values());

      if (players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }

      // Start the game
      roomData.gameState = 'playing';
      roomData.currentRound = 1;
      roomData.timeLeft = 60; // Default draw time

      // Select first drawer
      const firstDrawer = players[0];
      firstDrawer.isDrawer = true;
      roomData.currentDrawer = firstDrawer.id;

      // Select random word (simplified - in real app, use word list)
      roomData.currentWord = getRandomWord();

      // Update database
      await Room.findOneAndUpdate(
        { code: roomCode.toUpperCase() },
        {
          status: 'playing',
          currentRound: 1,
          currentWord: roomData.currentWord,
          timeLeft: roomData.timeLeft
        }
      );

      // Notify all players
      io.to(roomCode).emit('game-started', {
        currentRound: roomData.currentRound,
        currentDrawer: roomData.currentDrawer,
        timeLeft: roomData.timeLeft,
        players: players
      });

      // Start timer
      startRoundTimer(roomCode, io);

    } catch (error) {
      console.error('Start game error:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Clear canvas
  socket.on('clear-canvas', (data) => {
    const { roomCode } = data;
    socket.to(roomCode).emit('canvas-cleared');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove from all rooms
    activeRooms.forEach((roomData, roomCode) => {
      if (roomData.players.has(socket.id)) {
        roomData.players.delete(socket.id);

        // Notify other players
        socket.to(roomCode).emit('player-left', { playerId: socket.id });

        // Clean up empty rooms
        if (roomData.players.size === 0) {
          activeRooms.delete(roomCode);
        }
      }
    });
  });
}

// Helper function to handle correct guess
async function handleCorrectGuess(roomCode, playerId, io) {
  const roomData = activeRooms.get(roomCode);
  if (!roomData) return;

  const players = Array.from(roomData.players.values());
  const currentDrawer = players.find(p => p.isDrawer);

  // Award points to drawer
  if (currentDrawer) {
    currentDrawer.score += 25;
  }

  // Check if round is complete
  const unguessedPlayers = players.filter(p => !p.hasGuessed && !p.isDrawer);
  if (unguessedPlayers.length === 0) {
    // Move to next round
    await nextRound(roomCode, io);
  }
}

// Move to next round
async function nextRound(roomCode, io) {
  const roomData = activeRooms.get(roomCode);
  if (!roomData) return;

  const players = Array.from(roomData.players.values());

  // Reset guess status
  players.forEach(p => {
    p.hasGuessed = false;
    p.isDrawer = false;
  });

  roomData.currentRound++;

  // Check if game is over
  const room = await Room.findOne({ code: roomCode.toUpperCase() });
  if (roomData.currentRound > room.rounds) {
    // End game
    roomData.gameState = 'finished';

    // Update database
    await Room.findOneAndUpdate(
      { code: roomCode.toUpperCase() },
      { status: 'finished' }
    );

    io.to(roomCode).emit('game-finished', {
      players: players.sort((a, b) => b.score - a.score)
    });
    return;
  }

  // Select next drawer
  const currentDrawerIndex = players.findIndex(p => p.id === roomData.currentDrawer);
  const nextDrawerIndex = (currentDrawerIndex + 1) % players.length;
  const nextDrawer = players[nextDrawerIndex];
  nextDrawer.isDrawer = true;
  roomData.currentDrawer = nextDrawer.id;

  // Select new word
  roomData.currentWord = getRandomWord();
  roomData.timeLeft = 60;

  // Update database
  await Room.findOneAndUpdate(
    { code: roomCode.toUpperCase() },
    {
      currentRound: roomData.currentRound,
      currentWord: roomData.currentWord,
      timeLeft: roomData.timeLeft
    }
  );

  io.to(roomCode).emit('next-round', {
    currentRound: roomData.currentRound,
    currentDrawer: roomData.currentDrawer,
    currentWord: roomData.currentWord,
    timeLeft: roomData.timeLeft,
    players: players
  });

  // Start timer for new round
  startRoundTimer(roomCode, io);
}

// Start round timer
function startRoundTimer(roomCode, io) {
  const roomData = activeRooms.get(roomCode);
  if (!roomData) return;

  const timer = setInterval(() => {
    roomData.timeLeft--;

    if (roomData.timeLeft <= 0) {
      clearInterval(timer);
      // Time's up - move to next round
      nextRound(roomCode, io);
    } else {
      // Send time update
      io.to(roomCode).emit('time-update', { timeLeft: roomData.timeLeft });
    }
  }, 1000);

  // Store timer reference
  roomData.timer = timer;
}

// Simple word list (in real app, use a proper word database)
function getRandomWord() {
  const words = [
    'apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar',
    'house', 'ice cream', 'jungle', 'kite', 'lion', 'mountain', 'nose',
    'ocean', 'piano', 'queen', 'rainbow', 'sun', 'tree', 'umbrella',
    'violin', 'whale', 'xylophone', 'yacht', 'zebra'
  ];
  return words[Math.floor(Math.random() * words.length)];
}

module.exports = { handleSocketConnection };
