#!/bin/bash

# Production Build Script for SmartPrint System
echo "🚀 Starting Production Build Process..."

# Set production environment
export NODE_ENV=production

# Copy production environment file
echo "📋 Setting up production environment..."
cp env.production.final .env.production

# Copy production Next.js config
echo "⚙️  Using production Next.js configuration..."
cp next.config.production.js next.config.js

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf out

# Install ALL dependencies (including dev dependencies needed for build)
echo "📦 Installing all dependencies..."
npm ci

# Generate Prisma client for production
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Run production build
echo "🔨 Running production build..."
npm run build

# Check build status
if [ $? -eq 0 ]; then
    echo "✅ Production build completed successfully!"
    echo "📁 Build output location: .next/"
    echo "🚀 Ready for deployment!"
else
    echo "❌ Production build failed!"
    exit 1
fi
