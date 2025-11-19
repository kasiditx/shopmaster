require('dotenv').config();
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Product Schema (simplified)
const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  category: String,
  stock: Number,
  images: [String],
  active: { type: Boolean, default: true },
  createdAt: Date
});

const Product = mongoose.model('Product', productSchema);

async function listProducts() {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).limit(20);
    
    console.log('\n📦 Products in Database:');
    console.log('='.repeat(80));
    
    if (products.length === 0) {
      console.log('❌ No products found in database!');
      console.log('\nYou need to create some products first.');
    } else {
      console.log(`Found ${products.length} products:\n`);
      
      products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   ID: ${product._id}`);
        console.log(`   Category: ${product.category}`);
        console.log(`   Price: $${product.price}`);
        console.log(`   Stock: ${product.stock}`);
        console.log(`   Active: ${product.active} ${product.active === undefined ? '⚠️  UNDEFINED!' : ''}`);
        console.log(`   Created: ${product.createdAt || 'N/A'}`);
        console.log('');
      });
      
      // Check if any products are missing 'active' field
      const missingActive = products.filter(p => p.active === undefined);
      if (missingActive.length > 0) {
        console.log(`\n⚠️  WARNING: ${missingActive.length} products are missing 'active' field!`);
        console.log('These products will not show up in the API.');
      }
    }
    
    console.log('='.repeat(80));
    process.exit(0);
  } catch (error) {
    console.error('Error listing products:', error);
    process.exit(1);
  }
}

listProducts();
