import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { handleSocketConnection } from './socket/socketHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);

// Serve static files from the frontend build
const frontendBuildPath = path.join(path.resolve(), '../dist');
app.use(express.static(frontendBuildPath));

// Handle SPA routing - return the main index.html for any route that doesn't match a file
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});
// Parse allowed origins from environment variable
const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map(url => url.trim())
  : ['http://localhost:8080'];

// Add development URLs if in development mode
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:8080', 'http://localhost:3000');
}

console.log('Allowed CORS origins:', allowedOrigins);

// Create Socket.IO server with enhanced CORS configuration
const io = new Server(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if the origin is in the allowed list
      if (allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      
      try {
        const originUrl = new URL(origin);
        const isAllowed = allowedOrigins.some(allowedOrigin => {
          try {
            const allowedUrl = new URL(allowedOrigin);
            return originUrl.origin === allowedUrl.origin;
          } catch (e) {
            console.warn(`Invalid allowed origin URL: ${allowedOrigin}`);
            return false;
          }
        });
        
        if (isAllowed) {
          return callback(null, true);
        }
      } catch (e) {
        console.warn(`Error processing origin: ${origin}`, e);
      }
      
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      console.warn(`CORS error: ${msg}`, { origin, allowedOrigins });
      return callback(new Error(msg), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: []
  },
  path: '/socket.io/',
  // Connection settings
  pingTimeout: 60000,    // 60 seconds
  pingInterval: 25000,   // 25 seconds
  // Message handling
  maxHttpBufferSize: 1e8, // 100MB
  maxPayload: 1e8,       // 100MB
  // Transport settings
  transports: ['websocket', 'polling'], // Try WebSocket first, fall back to polling
  allowUpgrades: true,
  // Compression
  httpCompression: true,
  perMessageDeflate: {
    threshold: 1024 // Only compress messages larger than 1KB
  },
  // Other options
  connectTimeout: 10000,  // 10 seconds
  serveClient: false,
  cookie: false
});

// Log connection events
io.engine.on("connection_error", (err) => {
  console.error('Socket.IO connection error:', err);
});

// Handle socket connections
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}, origin: ${socket.handshake.headers.origin}`);
  handleSocketConnection(socket, io);
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User disconnected: ${socket.id}, reason: ${reason}`);
  });
  
  // Heartbeat for Render free tier
  socket.on('ping', (cb) => {
    if (typeof cb === 'function') {
      cb();
    }
  });
});

// Configure CORS for HTTP requests
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Root endpoint for Render health checks
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'DrawBattle server is running' });
});

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DrawBattle server is running' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}, origin: ${socket.handshake.headers.origin}`);
  handleSocketConnection(socket, io);
});

// Get port from environment variable or use default
const PORT = process.env.PORT || 3001;

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop the server');
  
  // Log available endpoints
  console.log('\nAvailable HTTP Endpoints:');
  console.log(`  GET  /             - Health check`);
  console.log(`  GET  /api/health   - Health check with more info`);
  console.log('\nWebSocket Endpoint:');
  console.log(`  ws://localhost:${PORT} - For real-time communication`);
});

module.exports = { app, server, io };
