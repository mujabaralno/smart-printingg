# Vercel Deployment Guide for SmartPrint

## Prerequisites

1. **Vercel Account**: Make sure you have a Vercel account connected to your GitHub repository
2. **PostgreSQL Database**: You'll need a PostgreSQL database (recommended: Vercel Postgres, Supabase, or Neon)

## Environment Variables Setup

In your Vercel project settings, add these environment variables:

### Required Environment Variables

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

# Twilio Configuration (you already have these)
NEXT_PUBLIC_TWILIO_ACCOUNT_SID=your_account_sid_here
NEXT_PUBLIC_TWILIO_AUTH_TOKEN=your_auth_token_here
NEXT_PUBLIC_TWILIO_FROM_NUMBER=+971588712409
NEXT_PUBLIC_TWILIO_VERIFY_SERVICE_ID=your_verify_service_id_here

# App Configuration
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-vercel-domain.vercel.app

# Security
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

### Database Setup

1. **Create a PostgreSQL database** (recommended options):
   - **Vercel Postgres**: Integrated with Vercel
   - **Supabase**: Free tier available
   - **Neon**: Serverless PostgreSQL

2. **Get your connection string** and add it as `DATABASE_URL`

3. **Run database migrations**:
   ```bash
   # Locally (if you have access to the production database)
   npx prisma db push
   
   # Or use Prisma Studio to manage data
   npx prisma studio
   ```

## Deployment Steps

1. **Push your changes** to GitHub:
   ```bash
   git add .
   git commit -m "Fix Vercel deployment with PostgreSQL and Prisma"
   git push origin main
   ```

2. **Vercel will automatically deploy** when it detects the push

3. **Monitor the build logs** for any issues

## Troubleshooting

### Common Issues

1. **Prisma Client Error**: Make sure `DATABASE_URL` is set correctly
2. **Build Failures**: Check that all environment variables are set
3. **Database Connection**: Verify your PostgreSQL database is accessible

### Build Commands

The updated build process includes:
- `prisma generate`: Generates Prisma Client
- `next build`: Builds the Next.js application
- `postinstall`: Ensures Prisma Client is generated after npm install

## Local Development

For local development, create a `.env.local` file with:

```bash
DATABASE_URL="file:./dev.db"
NODE_ENV=development
# ... other variables
```

This will use SQLite locally while using PostgreSQL in production.

## Support

If you encounter issues:
1. Check the Vercel build logs
2. Verify environment variables are set correctly
3. Ensure your PostgreSQL database is running and accessible
