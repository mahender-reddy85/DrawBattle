import express from "express";
import http from "http";
import path from "path";
import { Server } from "socket.io";
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { handleSocketConnection } from './socket/socketHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// IMPORTANT: Resolve the current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Socket.IO configuration
const io = new Server(server, {
  cors: { 
    origin: "*", 
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

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, "../dist")));

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'DrawBattle server is running',
    timestamp: new Date().toISOString()
  });
});

// Handle SPA routing - must be after all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
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
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, "../dist")}`);
  console.log(`🔌 WebSocket server available at ws://localhost:${PORT}`);
  console.log('\nAvailable Endpoints:');
  console.log(`  GET  /             - Serves the frontend application`);
  console.log(`  GET  /api/health   - Health check endpoint`);
  console.log(`  WS   /             - WebSocket endpoint for real-time communication`);
  console.log('\nPress Ctrl+C to stop the server\n');
});

export { app, server, io };
