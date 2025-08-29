#!/bin/bash

echo "🔄 Switching to LOCAL SQLite development..."

# Copy local SQLite schema
cp prisma/schema-local.sqlite.prisma prisma/schema.prisma

# Regenerate Prisma client
echo "📦 Regenerating Prisma client..."
npx prisma generate

echo "✅ Switched to LOCAL SQLite development!"
echo "🌐 Database: SQLite (file:./dev.db)"
echo "🚀 Run 'npm run dev' to start development server"
