#!/bin/bash

echo "🐘 Installing PostgreSQL on macOS..."

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew is not installed. Please install Homebrew first:"
    echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
    exit 1
fi

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
brew install postgresql@15

# Start PostgreSQL service
echo "🚀 Starting PostgreSQL service..."
brew services start postgresql@15

# Wait for service to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Create database and user
echo "🔧 Setting up database..."
createdb smart_printing_local
psql postgres -c "CREATE USER smart_user WITH PASSWORD 'smart_password';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE smart_printing_local TO smart_user;"

echo "✅ PostgreSQL installation complete!"
echo "🌐 Database: localhost:5432"
echo "📊 Database: smart_printing_local"
echo "👤 Username: smart_user"
echo "🔑 Password: smart_password"
echo ""
echo "📝 Update your env.local with:"
echo "DATABASE_URL=\"postgresql://smart_user:smart_password@localhost:5432/smart_printing_local\""
echo ""
echo "🚀 Run 'npm run dev' to start development server"
