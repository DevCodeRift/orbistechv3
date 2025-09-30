# Discord OAuth Setup for orbistech.dev

## Discord Application Configuration

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name: `OrbisTech Alliance Management`
4. Save the **Application ID** (Client ID)

### 2. OAuth2 Configuration

In your Discord application settings, go to **OAuth2** → **General**:

#### Redirect URLs (Add all of these):

**Production URLs:**
- `https://admin.orbistech.dev/api/auth/callback/discord`
- `https://*.orbistech.dev/api/auth/callback/discord` (wildcard for subdomains)

**Development URLs (for local testing):**
- `http://localhost:3001/api/auth/callback/discord`
- `http://localhost:3002/api/auth/callback/discord`

#### Scopes Required:
- `identify` - Get user's basic Discord info
- `email` - Get user's email address
- `guilds` - See what Discord servers user is in (optional, for alliance verification)

### 3. Bot Configuration

1. Go to **Bot** section
2. Click "Add Bot"
3. Bot Username: `OrbisTech-{AllianceName}` (this will be per-alliance)
4. **Important**: Don't create the bot token yet - each alliance will have their own bot

### 4. Get Your Credentials

From the **General Information** page:
- **Application ID**: `123456789012345678` (example)
- **Client Secret**: Click "Reset Secret" to generate

## Environment Variable Configuration

### Production Environment Variables

Update your Vercel environment variables:

```bash
# Database (use a production database like Railway PostgreSQL)
DATABASE_URL="postgresql://username:password@host:port/database"

# Discord OAuth
DISCORD_CLIENT_ID="your-application-id-here"
DISCORD_CLIENT_SECRET="your-client-secret-here"

# NextAuth (generate new secrets for production)
NEXTAUTH_SECRET="your-production-nextauth-secret"
NEXTAUTH_URL="https://admin.orbistech.dev" # or tenant subdomain

# Encryption
ENCRYPTION_KEY="your-production-encryption-key"

# Environment
NODE_ENV="production"
```

### Subdomain-Specific Configuration

Each application needs its own NEXTAUTH_URL:

**Admin App (admin.orbistech.dev):**
```bash
NEXTAUTH_URL="https://admin.orbistech.dev"
```

**Tenant Apps (*.orbistech.dev):**
```bash
NEXTAUTH_URL="https://[subdomain].orbistech.dev"
```

## Vercel Deployment Configuration

### 1. Domain Setup

In Vercel dashboard:
1. Add custom domain: `orbistech.dev`
2. Configure DNS:
   - Add A record: `@` → Vercel IP
   - Add CNAME: `*` → `cname.vercel-dns.com` (for subdomains)
   - Add CNAME: `admin` → `cname.vercel-dns.com`

### 2. Application Deployment

Deploy each app separately:

**Admin App:**
- Domain: `admin.orbistech.dev`
- Root Directory: `apps/admin-app`
- Build Command: `npm run build`

**Tenant App:**
- Domain: `orbistech.dev` and `*.orbistech.dev`
- Root Directory: `apps/tenant-app`
- Build Command: `npm run build`

## Testing the OAuth Flow

### 1. Local Testing
```bash
# Update local .env.local files with real Discord credentials
DISCORD_CLIENT_ID="your-real-client-id"
DISCORD_CLIENT_SECRET="your-real-client-secret"

# Start applications
npm run dev:admin  # localhost:3002
npm run dev:tenant # localhost:3001
```

### 2. Production Testing
1. Deploy to Vercel
2. Visit `https://admin.orbistech.dev`
3. Test Discord OAuth login
4. Create first alliance and test subdomain access

## Security Considerations

### 1. Environment Separation
- Use different Discord applications for dev/prod
- Separate encryption keys
- Different database instances

### 2. Subdomain Security
- Each alliance gets isolated subdomain
- Tenant validation in middleware
- Row-level security in database

### 3. Bot Token Management
- Each alliance has separate Discord bot
- Bot tokens encrypted in database
- Alliance-specific bot permissions

## Database Migration to Production

### 1. Production Database Setup
```bash
# Railway PostgreSQL (recommended)
# 1. Create Railway project
# 2. Add PostgreSQL service
# 3. Get connection string

# Update Prisma schema for PostgreSQL
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Run migrations
npx prisma db push
```

### 2. Create Super Admin
```sql
-- After first Discord login, promote user to super admin
UPDATE users
SET role = 'SUPER_ADMIN'
WHERE discord_id = 'your-discord-id';
```

## Production Checklist

- [ ] Discord application created with correct redirect URLs
- [ ] Production database (PostgreSQL) set up
- [ ] Environment variables configured in Vercel
- [ ] Domain DNS configured for orbistech.dev
- [ ] Admin app deployed to admin.orbistech.dev
- [ ] Tenant app deployed with wildcard subdomain support
- [ ] First Discord OAuth login tested
- [ ] Super admin user created
- [ ] First alliance authorized and tested

## Troubleshooting

### Common Issues
1. **OAuth Redirect Mismatch**: Ensure exact URL match in Discord settings
2. **Subdomain Not Working**: Check DNS wildcard CNAME configuration
3. **Database Connection**: Verify DATABASE_URL format and credentials
4. **Environment Variables**: Check all required vars are set in Vercel

### Debug Steps
1. Check Vercel function logs
2. Verify Discord application settings
3. Test OAuth flow step by step
4. Check database connectivity