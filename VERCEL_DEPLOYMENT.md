# Vercel Deployment Guide

## Environment Variables

You need to set up the following environment variables in your Vercel project:

### Required Environment Variables

1. **DATABASE_URL** - Your Prisma database connection string
   - Example: `postgresql://username:password@host:port/database`
   - Or for PostgreSQL on Vercel: `postgres://username:password@host:port/database`

2. **NODE_ENV** - Set to `production` (automatically set by Vercel)

### Optional Environment Variables

- **HOST** - Server host (defaults to localhost for local development)
- **PORT** - Server port (Vercel will set this automatically)

## Setting Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your database connection string
   - **Environment**: Production, Preview, Development (select all)

## Database Setup

### Option 1: Vercel Postgres (Recommended)
1. In your Vercel project dashboard, go to Storage
2. Create a new Postgres database
3. Copy the connection string and use it as `DATABASE_URL`

### Option 2: External Database
- Use any PostgreSQL provider (Supabase, PlanetScale, Railway, etc.)
- Get the connection string and set it as `DATABASE_URL`

## Deployment Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables** (if not done via dashboard):
   ```bash
   vercel env add DATABASE_URL
   ```

5. **Run Database Migrations**:
   ```bash
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

## Important Notes

- The server is configured to work with Vercel's serverless functions
- File uploads are stored in the `/public/uploads` directory
- Static files are served from the `/public` directory
- The API endpoints are available at `/api/*`
- Health check endpoint: `/api/health`

## API Endpoints

- `GET /api/articles` - Get all articles
- `POST /api/articles` - Create new article
- `DELETE /api/articles/:id` - Delete article
- `POST /api/images/upload` - Upload image
- `GET /api/health` - Health check

## Troubleshooting

1. **Database Connection Issues**:
   - Ensure `DATABASE_URL` is correctly set
   - Check if your database allows connections from Vercel's IP ranges

2. **Build Failures**:
   - Make sure all dependencies are in `dependencies` (not `devDependencies`)
   - Check that Prisma client is generated during build

3. **File Upload Issues**:
   - Vercel has a 4.5MB limit for serverless functions
   - Consider using external storage (AWS S3, Cloudinary) for production

## Local Development

To test locally with Vercel:
```bash
vercel dev
```

This will run your app locally with Vercel's development environment.