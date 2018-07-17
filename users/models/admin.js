'use strict';

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  username: { type: String },
  email: { type: String, require: true, unique: true },
  companyName: { type: String, require: true },
  password: { type: String, require: true },
  phoneNumber: {type: Number, required:true}
}, { timestamps: true });

adminSchema.set('toObject', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
  }
});

adminSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

adminSchema.statics.hashPassword = function (password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model('Admin', adminSchema);