const mongoose = require('mongoose');

// Define UserSchema & UserModel
const frameSchema = new mongoose.Schema({
  img: { type: String, required: true },
  name: { type: String, required: true },
  location: { type: String, default: '' }
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }
});

// cardSchema.index({ prompt: 1, answer: 1 }, { unique: true });

cardSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Frame', cardSchema);