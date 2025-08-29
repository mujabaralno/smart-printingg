#!/bin/bash

echo "🐘 Setting up local PostgreSQL database..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create a local PostgreSQL container
echo "📦 Creating PostgreSQL container..."
docker run --name smart-printing-postgres \
    -e POSTGRES_DB=smart_printing_local \
    -e POSTGRES_USER=smart_user \
    -e POSTGRES_PASSWORD=smart_password \
    -p 5432:5432 \
    -d postgres:15

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Test connection
echo "🔍 Testing database connection..."
docker exec smart-printing-postgres psql -U smart_user -d smart_printing_local -c "SELECT version();"

echo "✅ Local PostgreSQL database setup complete!"
echo "🌐 Database: localhost:5432"
echo "📊 Database: smart_printing_local"
echo "👤 Username: smart_user"
echo "🔑 Password: smart_password"
echo ""
echo "📝 Update your env.local with:"
echo "DATABASE_URL=\"postgresql://smart_user:smart_password@localhost:5432/smart_printing_local\""
echo ""
echo "🚀 Run 'npm run dev' to start development server"
