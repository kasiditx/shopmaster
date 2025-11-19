const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema(
  {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    address: addressSchema,
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true }],
  },
  { timestamps: true },
);

userSchema.methods.matchPassword = async function matchPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
