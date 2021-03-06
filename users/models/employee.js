
//Hash employee passwords

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
	firstname: { type: String, required : true },
	lastname: { type: String, required : true },
	img: { type: String },
	email: { type: String, require: true, unique: true },
	adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
	password: { type: String, require: true },
	phoneNumber: { type: String, require: true },
	availability : {type: Array}
});

employeeSchema.set('toObject', {
	transform: (document, ret) => {
		ret.id = ret._id;
		delete ret._id;
		delete ret.__v;
		delete ret.password;
	}
});

employeeSchema.methods.validatePassword = function(password) {
	return bcrypt.compare(password, this.password);
};

employeeSchema.statics.hashPassword = function (password) {
	return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('Employee', employeeSchema);