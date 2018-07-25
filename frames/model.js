const mongoose = require('mongoose');
const moment = require('moment');

// Define Frames Schema & Frames Model
const frameSchema = new mongoose.Schema({
	adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
	employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: false},
	startFrame: { type: Date, require: true },
	endFrame: { type: Date, require: true },
}, { timestamps: true });

const options = {year: 'numeric', month: '2-digit', day: 'numeric', hour: 'numeric', minute: 'numeric', hc: 'h24'};

frameSchema.set('toObject', {
	transform: function (doc, ret) {
		ret.id = ret._id;
		ret.startFrame = moment(ret.startFrame);
		ret.endFrame = moment(ret.endFrame);
		delete ret._id;
		delete ret.__v;
	}
});

module.exports = mongoose.model('Frame', frameSchema);