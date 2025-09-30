# Deployment Guide: Vercel + Railway

This guide covers deploying OrbistechV3 to production using **one unified Vercel deployment** for all web functionality and Railway for the Discord bot.

## Architecture Overview

**Single Vercel Deployment:**
- `yourdomain.com` → Landing page
- `admin.yourdomain.com` → Admin interface
- `*.yourdomain.com` → Tenant dashboards
- All handled by one Next.js app with middleware-based routing

**Railway Deployment:**
- Discord bot
- PostgreSQL database

## Prerequisites

### Required Services
1. **Vercel Account** - For hosting tenant-app and admin-app
2. **Railway Account** - For hosting discord-bot and PostgreSQL database
3. **Discord Developer Account** - For OAuth and bot functionality
4. **Domain Name** - For custom subdomain routing

### Required Information
- Discord Application ID and Client Secret
- Database connection string
- Encryption key (32 characters)
- Super admin Discord IDs

## Step 1: Database Setup (Railway)

### 1.1 Create PostgreSQL Database
```bash
# In Railway dashboard
1. Create new project
2. Add PostgreSQL database service
3. Note the DATABASE_URL from the Connect tab
```

### 1.2 Set up Database Schema
```bash
# Clone the repository locally
git clone <your-repo-url>
cd orbistechv3

# Install dependencies
npm install

# Set up database environment
echo "DATABASE_URL=your-railway-postgres-url" > packages/database/.env

# Generate Prisma client and push schema
npm run db:generate
npm run db:push
```

## Step 2: Discord Application Setup

### 2.1 Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Note the **Application ID** and **Client Secret**
4. In OAuth2 → General:
   - Add redirect URIs:
     - `https://yourdomain.com/api/auth/callback/discord`
     - `https://admin.yourdomain.com/api/auth/callback/discord`
     - `http://localhost:3001/api/auth/callback/discord` (for development)
     - `http://localhost:3002/api/auth/callback/discord` (for development)

### 2.2 Create Bot User
1. Go to Bot section
2. Create bot user
3. Reset token and save it securely
4. Enable necessary intents:
   - Server Members Intent
   - Message Content Intent

## Step 3: Environment Variables

### 3.1 Generate Required Keys
```bash
# Generate NextAuth secret (32+ characters)
openssl rand -base64 32

# Generate encryption key (32 characters exactly)
openssl rand -hex 16
```

### 3.2 Prepare Environment Variables
Create a secure document with these values:

```env
# Database
DATABASE_URL="your-railway-postgres-url"

# Auth
NEXTAUTH_SECRET="your-generated-nextauth-secret"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Encryption
ENCRYPTION_KEY="your-32-char-encryption-key"

# Super Admin
SUPER_ADMIN_DISCORD_IDS="your-discord-id,other-admin-discord-id"
```

## Step 4: Vercel Deployment (Single App)

### 4.1 Deploy Unified Web App
```bash
# Connect to Vercel
npx vercel login

# Deploy from the web app directory (or set up through GitHub)
cd apps/web-app
npx vercel

# Follow prompts:
# - Link to new project: Yes
# - Project name: orbistech-web
# - Directory: ./
# - Override settings: No

# OR deploy from root and point to web-app (recommended for monorepo)
# Set root directory to: apps/web-app
# Build command: cd ../.. && npm run build --filter=@orbistech/web-app
```

### 4.2 Configure Environment Variables in Vercel
Add these environment variables in Vercel dashboard for the single project:

```env
DATABASE_URL=your-railway-postgres-url
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://yourdomain.com
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
ENCRYPTION_KEY=your-32-char-encryption-key
SUPER_ADMIN_DISCORD_IDS=your-discord-id,other-admin-id
NODE_ENV=production
```

### 4.3 Configure Custom Domains
1. In Vercel dashboard → Domains
2. Add ALL your domains to this single project:
   - `yourdomain.com` (main/landing)
   - `admin.yourdomain.com` (admin interface)
   - `*.yourdomain.com` (wildcard for all tenant subdomains)

### 4.4 Verify Middleware Routing
Your middleware handles all routing:
- `yourdomain.com` → Landing page or redirect to admin
- `admin.yourdomain.com` → Admin routes
- `alliance.yourdomain.com` → Tenant dashboard for "alliance"

## Step 5: Railway Bot Deployment

### 5.1 Deploy Discord Bot
```bash
# In Railway dashboard
1. Create new service in your existing project
2. Connect GitHub repository
3. Set root directory to: apps/discord-bot
4. Deploy
```

### 5.2 Configure Bot Environment Variables
In Railway dashboard, add environment variables:

```env
DATABASE_URL=your-railway-postgres-url
ENCRYPTION_KEY=your-32-char-encryption-key
DISCORD_APPLICATION_ID=your-discord-application-id
NODE_ENV=production
PORT=3000
```

## Step 6: DNS Configuration

### 6.1 Configure DNS Records
Point your domain to Vercel:

```dns
# A Records
yourdomain.com → 76.76.19.61
*.yourdomain.com → 76.76.19.61

# CNAME Records
admin.yourdomain.com → cname.vercel-dns.com
```

### 6.2 Update Discord OAuth URLs
Update redirect URIs in Discord Developer Portal:
- `https://yourdomain.com/api/auth/callback/discord`
- `https://admin.yourdomain.com/api/auth/callback/discord`

## Step 7: Verification and Testing

### 7.1 Test Deployments
```bash
# Test tenant app
curl https://yourdomain.com/api/health

# Test admin app
curl https://admin.yourdomain.com/api/health

# Check Railway bot logs
# View logs in Railway dashboard
```

### 7.2 Test Database Connection
```bash
# Run database connectivity test
cd packages/database
npm run db:studio
```

### 7.3 Test Discord Integration
1. Log into admin app with Discord
2. Create a test tenant
3. Verify subdomain routing works
4. Test Discord OAuth on tenant subdomain

## Step 8: Post-Deployment Setup

### 8.1 Create First Super Admin
1. Log into Discord and get your Discord User ID
2. Add your Discord ID to `SUPER_ADMIN_DISCORD_IDS` environment variable
3. Redeploy admin app
4. Access https://admin.yourdomain.com

### 8.2 Monitor Deployments
- **Vercel**: Monitor in Vercel dashboard → Functions
- **Railway**: Monitor in Railway dashboard → Metrics
- **Database**: Use Railway PostgreSQL metrics

### 8.3 Set up Error Tracking (Optional)
Add Sentry DSN to environment variables:
```env
SENTRY_DSN=your-sentry-dsn
```

## Troubleshooting

### Common Issues

**Vercel Build Failures:**
```bash
# Check build logs in Vercel dashboard
# Common fix: ensure all environment variables are set
# Verify Turbo.json configuration
```

**Railway Database Connection:**
```bash
# Verify DATABASE_URL format
# Check Railway database status
# Ensure database is accessible from Railway services
```

**Discord OAuth Issues:**
```bash
# Verify redirect URIs match exactly
# Check NEXTAUTH_URL matches domain
# Ensure Discord app is public
```

**Subdomain Routing Issues:**
```bash
# Verify Vercel domain configuration
# Check middleware.ts in tenant-app
# Ensure wildcard domain is properly configured
```

### Logs and Debugging
```bash
# Vercel logs
npx vercel logs --app=orbistech-tenant

# Railway logs
# View in Railway dashboard → Deployments → Logs

# Database queries
# Use Railway PostgreSQL query interface
```

## Security Checklist

- [ ] All environment variables use production values
- [ ] Database connection uses SSL
- [ ] NextAuth secret is 32+ characters
- [ ] Encryption key is exactly 32 characters
- [ ] Discord OAuth URLs use HTTPS
- [ ] Super admin Discord IDs are correct
- [ ] No sensitive data in git history
- [ ] Environment files are in .gitignore

## Maintenance

### Regular Tasks
1. **Monitor resource usage** in Railway and Vercel dashboards
2. **Update dependencies** monthly
3. **Backup database** regularly
4. **Monitor error rates** and response times
5. **Review security logs** for suspicious activity

### Scaling Considerations
- **Database**: Upgrade Railway PostgreSQL plan as needed
- **Vercel**: Monitor function execution time and requests
- **Railway Bot**: Monitor memory usage and response times

This deployment setup provides a robust, scalable foundation for the OrbistechV3 multi-tenant alliance management system.