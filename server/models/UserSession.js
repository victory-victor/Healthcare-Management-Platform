const mongoose = require('mongoose');

const userSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isValid: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

userSessionSchema.index({ refreshToken: 1 });
userSessionSchema.index({ user: 1 });

module.exports = mongoose.model('UserSession', userSessionSchema);
