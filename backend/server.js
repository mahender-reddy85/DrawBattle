import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { handleSocketConnection } from './socket/socketHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the dist directory
app.use(express.static(join(__dirname, '..', 'dist'), {
  maxAge: '1y',
  etag: true,
  index: 'index.html'
}));

// PRODUCTION-SAFE CORS
const allowedOrigins = [
  'http://localhost:8080',
  'https://draw-battle-peach.vercel.app'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  } else {
    console.error('CORS blocked origin:', origin);
    res.status(403).json({ error: 'CORS blocked' });
  }
});

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8,
  maxPayload: 1e8,
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  httpCompression: true,
  serveClient: false
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DrawBattle server is running',
    timestamp: new Date().toISOString()
  });
});

// Handle SPA routing - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}, origin: ${socket.handshake.headers.origin}`);
  
  // Use the socket handler from socketHandler.js
  handleSocketConnection(socket, io);
  
  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
  
  // Heartbeat handler
  socket.on('ping', (cb) => {
    if (typeof cb === 'function') {
      cb();
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server available at ws://localhost:${PORT}`);
  console.log('\nAvailable Endpoints:');
  console.log(`  GET  /api/health   - Health check endpoint`);
  console.log(`  WS   /             - WebSocket endpoint for real-time communication`);
  console.log('\nPress Ctrl+C to stop the server\n');
});

export { app, server, io };
