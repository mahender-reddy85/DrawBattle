const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 50
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    minlength: 4,
    maxlength: 6
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    avatar: {
      type: Number,
      default: 0
    },
    score: {
      type: Number,
      default: 0
    },
    isConnected: {
      type: Boolean,
      default: true
    }
  }],
  playerCount: {
    type: Number,
    default: 0
  },
  maxPlayers: {
    type: Number,
    default: 8,
    min: 2,
    max: 12
  },
  rounds: {
    type: Number,
    default: 3,
    min: 1,
    max: 10
  },
  drawTime: {
    type: Number,
    default: 60,
    min: 30,
    max: 120
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  currentRound: {
    type: Number,
    default: 0
  },
  currentWord: {
    type: String,
    default: null
  },
  currentDrawer: {
    type: String,
    default: null
  },
  timeLeft: {
    type: Number,
    default: 0
  },
  settings: {
    customWords: [String],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    allowSpectators: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
roomSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient querying
roomSchema.index({ code: 1 });
roomSchema.index({ host: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Room', roomSchema);
