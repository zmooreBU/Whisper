const mongoose = require('mongoose');
const { Schema, model } = mongoose;

//model for storing the one time password in the database
const OTPSchema = new Schema({
    email: {
      type: String,
      required: true
    },
    otp: {
      type: String,
      required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 900
    }
  });

OTPSchema.index({ email:1});
OTPSchema.index({ createdAt: 1}, {expireAfterSeconds: 900});

module.exports = model('OTPSchema', OTPSchema);