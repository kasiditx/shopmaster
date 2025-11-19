#!/bin/bash

echo "🎨 Applying Modern UI Design to ShopMaster..."
echo "================================================"

# Navigate to client directory
cd client

# Install Tailwind if not installed
echo "📦 Checking Tailwind CSS installation..."
npm list tailwindcss || npm install -D tailwindcss postcss autoprefixer

# Generate Tailwind config if not exists
if [ ! -f "tailwind.config.js" ]; then
    echo "⚙️  Generating Tailwind configuration..."
    npx tailwindcss init -p
fi

echo "✅ Modern UI setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart React development server"
echo "2. Run: npm start"
echo "3. Open http://localhost:3000"
echo ""
echo "🎉 Enjoy your beautiful new UI!"
