const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { handleSocketConnection } = require('./socket/socketHandler');

dotenv.config();

const app = express();
const server = http.createServer(app);
// Parse allowed origins from environment variable
const allowedOrigins = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map(url => url.trim())
  : ['http://localhost:8080'];

// Add development URLs if in development mode
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:8080', 'http://localhost:3000');
}

console.log('Allowed CORS origins:', allowedOrigins);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  pingInterval: 25000,
  pingTimeout: 60000,
  maxHttpBufferSize: 1e6
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
