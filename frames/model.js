const mongoose = require('mongoose');

// Define Frames Schema & Frames Model
const frameSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  startFrame: { type: Date, require: true },
  endFrame: { type: Date, require: true }
}, { timestamps: true });

frameSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Frame', frameSchema);