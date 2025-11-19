require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    const adminEmail = 'admin@shopmaster.com';
    const adminPassword = 'admin123';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      process.exit(0);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash: passwordHash,
      role: 'admin'
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('\nYou can now login with these credentials.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
