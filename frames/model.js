const mongoose = require('mongoose');

// Define Frames Schema & Frames Model
const frameSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  startFrame: { type: Date, require: true },
  endFrame: { type: Date, require: true }
}, { timestamps: true });

const options = {year: 'numeric', month: '2-digit', day: 'numeric', hour: 'numeric', minute: 'numeric', hc: "h24"};

frameSchema.set('toObject', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    ret.startFrame = new Date(ret.startFrame).toLocaleString("nl", options);
    ret.endFrame = new Date(ret.endFrame).toLocaleString("nl", options);
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model('Frame', frameSchema);