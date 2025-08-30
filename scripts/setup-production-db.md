# Production Database Setup Guide

## The Problem
Your production database is not connecting because the environment variables are not properly configured in Vercel.

## Solution Steps

### 1. Update Vercel Environment Variables
Go to your Vercel dashboard and add these environment variables:

```
DATABASE_URL=postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require
DATABASE_PROVIDER=postgresql
NODE_ENV=production
PRISMA_GENERATE_DATAPROXY=true
```

### 2. Update Prisma Schema
The Prisma schema needs to be updated to handle both environments. Create a new file `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = env("DATABASE_PROVIDER")
  url      = env("DATABASE_URL")
}

// ... rest of your models
```

### 3. Deploy the Changes
After updating the environment variables and schema:

1. Commit your changes
2. Push to GitHub
3. Vercel will automatically redeploy

### 4. Verify Connection
Check the database health endpoint:
```
https://smart-printing.vercel.app/api/database-health
```

## Current Status
- ✅ Local database working (SQLite)
- ❌ Production database not connecting (PostgreSQL)
- 🔧 Environment variables need configuration in Vercel

## Why This Happened
- Frontend changes were deployed successfully
- Database configuration was not updated for production
- Environment variables are missing in Vercel
- Prisma schema is hardcoded for SQLite

## Next Steps
1. Update Vercel environment variables (most important)
2. Update Prisma schema to be environment-aware
3. Redeploy the application
4. Test production database connection
