# Development Setup Guide

## Prerequisites

1. **Node.js 18+** - Required for all applications
2. **PostgreSQL** - Database for the application
3. **Discord Developer Account** - For OAuth and bot functionality
4. **Politics & War Account** - For API testing

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd orbistechv3
npm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL locally
2. Create database: `createdb orbistechv3`
3. Update `DATABASE_URL` in environment files

#### Option B: Cloud Database (Recommended)
- **Railway**: Free PostgreSQL with easy setup
- **PlanetScale**: MySQL alternative with branching
- **Neon**: Serverless PostgreSQL

### 3. Environment Configuration

Copy environment files and fill in your values:

```bash
# Root environment
cp .env.example .env.local

# Application environments
cp apps/tenant-app/.env.example apps/tenant-app/.env.local
cp apps/admin-app/.env.example apps/admin-app/.env.local
cp apps/discord-bot/.env.example apps/discord-bot/.env.local
```

### 4. Discord Application Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application
3. Note the **Application ID** and **Client Secret**
4. Set OAuth2 redirect URLs:
   - `http://localhost:3001/api/auth/callback/discord` (Tenant App)
   - `http://localhost:3002/api/auth/callback/discord` (Admin App)
5. Create a bot and note the **Bot Token**

### 5. Generate Required Keys

```bash
# Generate NextAuth secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Environment Variables

Update your `.env.local` files with:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/orbistechv3"

# NextAuth
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3001" # or 3002 for admin

# Discord
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Encryption
ENCRYPTION_KEY="your-generated-encryption-key"

# Environment
NODE_ENV="development"
```

### 7. Database Migration

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 8. Start Development Servers

```bash
# Terminal 1: Tenant App (port 3001)
cd apps/tenant-app
npm run dev

# Terminal 2: Admin App (port 3002)
cd apps/admin-app
npm run dev

# Terminal 3: Discord Bot
cd apps/discord-bot
npm run dev
```

## Application URLs

- **Tenant App**: http://localhost:3001 (subdomain.domain.com)
- **Admin App**: http://localhost:3002 (admin panel)
- **Discord Bot**: Runs in background, connects to Discord

## Initial Setup Workflow

### 1. Create Super Admin User

1. Sign in to Admin App with Discord
2. Manually update user role in database:
   ```sql
   UPDATE users SET role = 'SUPER_ADMIN' WHERE discord_id = 'your-discord-id';
   ```

### 2. Authorize First Alliance

1. Login to Admin App as Super Admin
2. Click "Authorize New Alliance"
3. Fill in alliance details:
   - Alliance ID (from Politics & War)
   - Alliance Name
   - Subdomain (e.g., "test-alliance")
   - Discord Admin ID

### 3. Test Alliance Setup

1. Visit `http://localhost:3001` (simulating subdomain)
2. Login with Discord as the alliance admin
3. Complete API key setup
4. Optionally configure Discord bot

### 4. Test Discord Bot

1. Create Discord test server
2. Use bot invite link from alliance dashboard
3. Test commands like `/help`, `/alliance info`

## Development Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run linting
npm run lint

# Type checking
npm run type-check

# Database commands
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Create migration
```

## Troubleshooting

### Database Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify database exists

### Authentication Issues
- Verify Discord app configuration
- Check NEXTAUTH_SECRET is set
- Ensure redirect URLs match

### Discord Bot Issues
- Verify bot token is correct
- Check bot permissions in Discord
- Ensure bot is invited to test server

### API Integration Issues
- Get valid P&W API key from account settings
- Test API key at https://politicsandwar.com/api/
- Check alliance ID exists

## Production Deployment

### Railway (Discord Bot)
1. Connect GitHub repository
2. Set environment variables
3. Deploy from main branch

### Vercel (Web Apps)
1. Connect GitHub repository
2. Configure build settings for monorepo
3. Set environment variables
4. Deploy tenant and admin apps separately

### Database
- Use production database (Railway PostgreSQL recommended)
- Run migrations in production
- Set up backups

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Use strong encryption keys
3. **Database**: Enable Row Level Security in production
4. **Discord**: Use separate bot tokens for dev/prod
5. **HTTPS**: Required for production OAuth

## Next Steps

1. Test basic functionality
2. Add real alliance data
3. Invite team members
4. Configure production deployments
5. Set up monitoring and logging