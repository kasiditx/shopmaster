require('dotenv').config();
const http = require('http');

const API_URL = 'http://localhost:5000';

function testAPI() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/products?limit=100',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('\n📡 API Response:');
          console.log('Status:', res.statusCode);
          console.log('Products count:', data.products?.length || 0);
          console.log('\nResponse structure:');
          console.log(JSON.stringify(data, null, 2));
          resolve();
        } catch (e) {
          console.error('Parse error:', e.message);
          console.log('Raw body:', body);
          resolve();
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error.message);
      resolve();
    });
    
    req.end();
  });
}

testAPI().then(() => process.exit(0));
