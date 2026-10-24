// server.js
// Express + Socket.io Server for Pico Park Web Clone

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { GameState } = require('./shared/physicsEngine');
const { LEVELS } = require('./shared/levels');
const { PLAYER_COLORS, EMOTES } = require('./shared/constants');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/shared', express.static(path.join(__dirname, 'shared')));

// Health check endpoint for hosting providers (Render, Railway, etc.)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', activeRooms: rooms.size });
});

// Rooms storage: roomCode -> { gameState, hostSocketId, players: Map(socketId -> playerMeta) }
const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

io.on('connection', (socket) => {
  let currentRoom = null;

  // 1. Create Room
  socket.on('createRoom', ({ name, colorId }) => {
    const roomCode = generateRoomCode();
    const gameState = new GameState(roomCode);
    const chosenColor = colorId !== undefined ? colorId : 0;
    const player = gameState.addPlayer(socket.id, name || 'Player 1', chosenColor);

    rooms.set(roomCode, {
      gameState,
      hostSocketId: socket.id,
      players: new Map([[socket.id, { name: player.name, colorId: player.colorId }]]),
    });

    currentRoom = roomCode;
    socket.join(roomCode);

    socket.emit('roomCreated', {
      roomCode,
      playerId: socket.id,
      isHost: true,
      levelsCount: LEVELS.length,
      player,
    });
  });

  // 2. Join Room
  socket.on('joinRoom', ({ roomCode, name, colorId }) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms.get(code);

    if (!room) {
      socket.emit('errorMsg', { message: `Room "${code}" not found! Check the room code.` });
      return;
    }

    if (room.gameState.players.size >= 8) {
      socket.emit('errorMsg', { message: `Room "${code}" is full (maximum 8 players)!` });
      return;
    }

    // Auto assign unused color if needed
    const usedColors = new Set(Array.from(room.gameState.players.values()).map(p => p.colorId));
    let finalColor = colorId;
    if (finalColor === undefined || usedColors.has(finalColor)) {
      for (let i = 0; i < 8; i++) {
        if (!usedColors.has(i)) {
          finalColor = i;
          break;
        }
      }
      if (finalColor === undefined) finalColor = Math.floor(Math.random() * 8);
    }

    const player = room.gameState.addPlayer(socket.id, name || `Player ${room.gameState.players.size + 1}`, finalColor);
    room.players.set(socket.id, { name: player.name, colorId: player.colorId });

    currentRoom = code;
    socket.join(code);

    socket.emit('roomJoined', {
      roomCode: code,
      playerId: socket.id,
      isHost: room.hostSocketId === socket.id,
      levelsCount: LEVELS.length,
      player,
    });

    io.to(code).emit('chatMessage', {
      sender: 'System',
      text: `${player.name} joined the game!`,
      isSystem: true,
    });
  });

  // 3. Player Inputs
  socket.on('playerInput', (inputs) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (room) {
      room.gameState.updatePlayerInputs(socket.id, inputs);
    }
  });

  // 4. Emotes
  socket.on('sendEmote', ({ emoteId }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (room) {
      room.gameState.triggerEmote(socket.id, emoteId);
    }
  });

  // 5. In-game Chat
  socket.on('sendChat', ({ text }) => {
    if (!currentRoom || !text || typeof text !== 'string') return;
    const room = rooms.get(currentRoom);
    if (room) {
      const playerMeta = room.players.get(socket.id);
      const cleanText = text.trim().slice(0, 100);
      if (cleanText) {
        io.to(currentRoom).emit('chatMessage', {
          sender: playerMeta ? playerMeta.name : 'Player',
          colorId: playerMeta ? playerMeta.colorId : 0,
          text: cleanText,
        });
      }
    }
  });

  // 6. Host Controls: Select Level
  socket.on('selectLevel', ({ levelIndex }) => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (room && room.hostSocketId === socket.id) {
      room.gameState.initLevel(levelIndex);
      io.to(currentRoom).emit('chatMessage', {
        sender: 'System',
        text: `Host switched to Level ${levelIndex + 1}!`,
        isSystem: true,
      });
    }
  });

  // 7. Host Controls: Restart Level
  socket.on('restartLevel', () => {
    if (!currentRoom) return;
    const room = rooms.get(currentRoom);
    if (room) {
      room.gameState.initLevel(room.gameState.currentLevelIndex);
      io.to(currentRoom).emit('chatMessage', {
        sender: 'System',
        text: `Level restarted!`,
        isSystem: true,
      });
    }
  });

  // 8. Disconnect Handling
  socket.on('disconnect', () => {
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        const playerMeta = room.players.get(socket.id);
        const name = playerMeta ? playerMeta.name : 'A player';

        room.gameState.removePlayer(socket.id);
        room.players.delete(socket.id);

        io.to(currentRoom).emit('chatMessage', {
          sender: 'System',
          text: `${name} left the game.`,
          isSystem: true,
        });

        // If host disconnected, reassign host
        if (room.hostSocketId === socket.id && room.players.size > 0) {
          const nextHostSocketId = room.players.keys().next().value;
          room.hostSocketId = nextHostSocketId;
          io.to(nextHostSocketId).emit('hostPromoted');
        }

        // Clean up empty room
        if (room.players.size === 0) {
          rooms.delete(currentRoom);
        }
      }
    }
  });
});

// Authoritative 60 FPS Physics Simulation Loop
let lastTime = Date.now();
const TICK_INTERVAL = 1000 / 60; // 60 ticks per second

setInterval(() => {
  const now = Date.now();
  const dt = Math.min((now - lastTime) / 1000, 0.1); // clamp max dt to 100ms
  lastTime = now;

  for (const [code, room] of rooms.entries()) {
    if (room.players.size > 0) {
      room.gameState.tick(dt);
      const snapshot = room.gameState.getSnapshot();
      io.to(code).emit('gameState', snapshot);
    }
  }
}, TICK_INTERVAL);

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🐾 Pico Park Web Server running on port ${PORT}`);
  console.log(`👉 Local: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
