// Store active rooms and their data in memory
const activeRooms = new Map();

function handleSocketConnection(socket, io) {
  console.log('User connected:', socket.id);

  // Heartbeat for Render free tier
  socket.on("ping", () => socket.emit("pong"));

  // Create room
  socket.on('create-room', (data) => {
    try {
      const { roomName, username, avatar, maxPlayers = 8, rounds = 3 } = data;

      // Generate unique room code
      let roomCode;
      do {
        roomCode = generateRoomCode();
      } while (activeRooms.has(roomCode));

      // Create room data
      const roomData = {
        id: roomCode,
        name: roomName,
        code: roomCode,
        host: socket.id,
        players: new Map(),
        messages: [],
        maxPlayers,
        rounds,
        currentRound: 0,
        currentDrawer: null,
        currentWord: null,
        timeLeft: 60,
        gameState: 'waiting',
        settings: {
          drawTime: 60,
          difficulty: 'medium'
        }
      };

      activeRooms.set(roomCode, roomData);

      // Add host as first player
      roomData.players.set(socket.id, {
        id: socket.id,
        username,
        avatar: avatar || 0,
        score: 0,
        isDrawer: false,
        isHost: true
      });

      socket.join(roomCode);

      // Send room created confirmation
      socket.emit('room-created', {
        room: {
          id: roomData.id,
          name: roomData.name,
          code: roomData.code,
          players: Array.from(roomData.players.values()),
          maxPlayers: roomData.maxPlayers,
          rounds: roomData.rounds,
          gameState: roomData.gameState
        }
      });

      console.log(`Room ${roomCode} created by ${username}`);

    } catch (error) {
      console.error('Create room error:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // Join room
  socket.on('join', (data) => {
    try {
      const { roomCode, username, avatar } = data;

      const roomData = activeRooms.get(roomCode.toUpperCase());
      if (!roomData) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (roomData.gameState !== 'waiting') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }

      if (roomData.players.size >= roomData.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      // Check if username is already taken
      const existingPlayer = Array.from(roomData.players.values())
        .find(p => p.username === username);
      if (existingPlayer) {
        socket.emit('error', { message: 'Username already taken in this room' });
        return;
      }

      socket.join(roomCode);

      // Add player to room
      roomData.players.set(socket.id, {
        id: socket.id,
        username,
        avatar: avatar || 0,
        score: 0,
        isDrawer: false,
        isHost: false
      });

      // Send current room state to new player
      socket.emit('room-joined', {
        room: {
          id: roomData.id,
          name: roomData.name,
          code: roomData.code,
          players: Array.from(roomData.players.values()),
          messages: roomData.messages,
          currentDrawer: roomData.currentDrawer,
          timeLeft: roomData.timeLeft,
          gameState: roomData.gameState,
          currentRound: roomData.currentRound,
          maxPlayers: roomData.maxPlayers,
          rounds: roomData.rounds
        }
      });

      // Notify other players
      socket.to(roomCode).emit('player-joined', {
        player: roomData.players.get(socket.id)
      });

      console.log(`${username} joined room ${roomCode}`);

    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Leave room
  socket.on('leave-room', (data) => {
    try {
      const { roomCode } = data;

      console.log(`User ${socket.id} left room ${roomCode}`);

      const roomData = activeRooms.get(roomCode);
      if (roomData) {
        roomData.players.delete(socket.id);

        // If no players left, clean up room
        if (roomData.players.size === 0) {
          activeRooms.delete(roomCode);
          clearInterval(roomData.timer);
        } else {
          // If host left, assign new host
          const hostLeft = !roomData.players.has(roomData.host);
          if (hostLeft) {
            const remainingPlayers = Array.from(roomData.players.values());
            roomData.host = remainingPlayers[0].id;
            remainingPlayers[0].isHost = true;
          }

          // Notify remaining players
          socket.to(roomCode).emit('player-left', { playerId: socket.id });
        }
      }

      socket.leave(roomCode);

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
  socket.on('send-message', (data) => {
    try {
      const { roomCode, message } = data;

      const roomData = activeRooms.get(roomCode);
      if (!roomData) return;

      const player = roomData.players.get(socket.id);
      if (!player) return;

      // Check if message is the correct word
      let isCorrect = false;
      if (roomData.currentWord &&
          message.toLowerCase().trim() === roomData.currentWord.toLowerCase() &&
          !player.isDrawer) {
        isCorrect = true;

        // Update player score
        player.score += Math.max(50, roomData.timeLeft * 2);
        player.hasGuessed = true;

        // Award points to drawer
        const drawer = Array.from(roomData.players.values())
          .find(p => p.isDrawer);
        if (drawer) {
          drawer.score += 25;
        }

        // Check if round is complete
        handleCorrectGuess(roomCode, socket.id, io);
      }

      const messageData = {
        id: Date.now(),
        username: player.username,
        message,
        timestamp: new Date(),
        isCorrect
      };

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
  socket.on('start-game', (data) => {
    try {
      const { roomCode } = data;

      const roomData = activeRooms.get(roomCode);
      if (!roomData) return;

      // Only host can start game
      if (roomData.host !== socket.id) {
        socket.emit('error', { message: 'Only room host can start the game' });
        return;
      }

      const players = Array.from(roomData.players.values());

      if (players.length < 2) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }

      // Start the game
      roomData.gameState = 'playing';
      roomData.currentRound = 1;
      roomData.timeLeft = roomData.settings.drawTime;

      // Reset player states
      players.forEach(p => {
        p.hasGuessed = false;
        p.isDrawer = false;
      });

      // Select first drawer
      const firstDrawer = players[0];
      firstDrawer.isDrawer = true;
      roomData.currentDrawer = firstDrawer.id;

      // Select random word
      roomData.currentWord = getRandomWord();

      // Notify all players
      io.to(roomCode).emit('game-started', {
        currentRound: roomData.currentRound,
        currentDrawer: roomData.currentDrawer,
        currentWord: roomData.currentWord,
        timeLeft: roomData.timeLeft,
        players: players
      });

      // Start timer
      startRoundTimer(roomCode, io);

      console.log(`Game started in room ${roomCode}`);

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
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
  });

    // Remove from all rooms
    activeRooms.forEach((roomData, roomCode) => {
      if (roomData.players.has(socket.id)) {
        roomData.players.delete(socket.id);

        // If no players left, clean up room
        if (roomData.players.size === 0) {
          activeRooms.delete(roomCode);
          clearInterval(roomData.timer);
        } else {
          // If host left, assign new host
          const hostLeft = !roomData.players.has(roomData.host);
          if (hostLeft) {
            const remainingPlayers = Array.from(roomData.players.values());
            roomData.host = remainingPlayers[0].id;
            remainingPlayers[0].isHost = true;
          }

          // Notify other players
          socket.to(roomCode).emit('player-left', { playerId: socket.id });
        }
      }
    });
  });
}

// Helper function to handle correct guess
function handleCorrectGuess(roomCode, playerId, io) {
  const roomData = activeRooms.get(roomCode);
  if (!roomData) return;

  const players = Array.from(roomData.players.values());

  // Check if all non-drawer players have guessed correctly
  const unguessedPlayers = players.filter(p => !p.hasGuessed && !p.isDrawer);
  if (unguessedPlayers.length === 0) {
    // Move to next round
    nextRound(roomCode, io);
  }
}

// Move to next round
function nextRound(roomCode, io) {
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
  if (roomData.currentRound > roomData.rounds) {
    // End game
    roomData.gameState = 'finished';
    clearInterval(roomData.timer);

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
  roomData.timeLeft = roomData.settings.drawTime;

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

  // Clear existing timer
  if (roomData.timer) {
    clearInterval(roomData.timer);
  }

  roomData.timer = setInterval(() => {
    roomData.timeLeft--;

    if (roomData.timeLeft <= 0) {
      clearInterval(roomData.timer);
      // Time's up - move to next round
      nextRound(roomCode, io);
    } else {
      // Send time update
      io.to(roomCode).emit('time-update', { timeLeft: roomData.timeLeft });
    }
  }, 1000);
}

// Generate unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Simple word list
function getRandomWord() {
  const words = [
    'apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar',
    'house', 'ice cream', 'jungle', 'kite', 'lion', 'mountain', 'nose',
    'ocean', 'piano', 'queen', 'rainbow', 'sun', 'tree', 'umbrella',
    'violin', 'whale', 'xylophone', 'yacht', 'zebra', 'butterfly', 'castle',
    'diamond', 'elephant', 'fireworks', 'garden', 'hamburger', 'island',
    'jellyfish', 'kangaroo', 'lighthouse', 'moon', 'notebook', 'octopus',
    'penguin', 'quilt', 'rocket', 'sunflower', 'telescope', 'unicorn',
    'volcano', 'waterfall', 'x-ray', 'yogurt', 'zucchini'
  ];
  return words[Math.floor(Math.random() * words.length)];
}

module.exports = { handleSocketConnection };
