require('dotenv').config();
const mongoose = require('mongoose');

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

async function makeUserAdmin() {
  try {
    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node scripts/makeUserAdmin.js <email>');
      console.log('Example: node scripts/makeUserAdmin.js user@example.com');
      process.exit(1);
    }
    
    // Find and update user
    const user = await User.findOneAndUpdate(
      { email: email },
      { role: 'admin' },
      { new: true }
    );
    
    if (!user) {
      console.log(`❌ User with email "${email}" not found.`);
      process.exit(1);
    }
    
    console.log('✅ User updated to admin successfully!');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating user:', error);
    process.exit(1);
  }
}

makeUserAdmin();
