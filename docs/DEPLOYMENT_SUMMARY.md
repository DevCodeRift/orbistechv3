# 🚀 OrbisTech v3 Deployment to orbistech.dev

## ✅ What's Complete

### **Development Environment**
- ✅ **Monorepo setup** with Turbo workspace
- ✅ **SQLite database** created and schema deployed
- ✅ **Environment configuration** with auto-generated secrets
- ✅ **All packages built** and dependencies installed

### **Production Configuration**
- ✅ **Discord OAuth setup** configured for orbistech.dev
- ✅ **Vercel configuration** files created
- ✅ **Subdomain routing** middleware implemented
- ✅ **Production environment** templates created
- ✅ **PostgreSQL schema** ready for production

## 🎯 Next Steps for Production Deployment

### **1. Discord Application Setup (5 minutes)**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create application: `OrbisTech Alliance Management`
3. Add OAuth redirect URLs:
   - `https://admin.orbistech.dev/api/auth/callback/discord`
   - `https://*.orbistech.dev/api/auth/callback/discord`
4. Copy **Client ID** and **Client Secret**

### **2. Database Setup (5 minutes)**
1. Create [Railway PostgreSQL](https://railway.app) database
2. Copy connection string
3. Replace SQLite with PostgreSQL in production

### **3. Vercel Deployment (10 minutes)**

#### **Project 1: Admin App**
```bash
# Deploy admin.orbistech.dev
Root Directory: apps/admin-app
Build Command: npm run build
Environment Variables:
- DATABASE_URL: [Railway PostgreSQL URL]
- NEXTAUTH_SECRET: f82ba2110bc7df5d4df7aaa71a733d85da328098bbfa314495b01638c11cb38d
- NEXTAUTH_URL: https://admin.orbistech.dev
- DISCORD_CLIENT_ID: [Your Discord Client ID]
- DISCORD_CLIENT_SECRET: [Your Discord Client Secret]
- ENCRYPTION_KEY: 03200e5acec0c9486e22bb1c1c5d64d6d1cee55afa1ba4f98fce319dd3532954
- NODE_ENV: production
```

#### **Project 2: Tenant App**
```bash
# Deploy *.orbistech.dev
Root Directory: apps/tenant-app
Build Command: npm run build
Environment Variables:
- DATABASE_URL: [Railway PostgreSQL URL]
- NEXTAUTH_SECRET: f82ba2110bc7df5d4df7aaa71a733d85da328098bbfa314495b01638c11cb38d
- NEXTAUTH_URL: https://orbistech.dev
- DISCORD_CLIENT_ID: [Your Discord Client ID]
- DISCORD_CLIENT_SECRET: [Your Discord Client Secret]
- ENCRYPTION_KEY: 03200e5acec0c9486e22bb1c1c5d64d6d1cee55afa1ba4f98fce319dd3532954
- NODE_ENV: production
```

### **4. Domain Configuration**
1. Add custom domain `orbistech.dev` to tenant app project
2. Add custom domain `admin.orbistech.dev` to admin app project
3. Configure DNS:
   - A record: `@` → Vercel IP
   - CNAME: `*` → `cname.vercel-dns.com`
   - CNAME: `admin` → `cname.vercel-dns.com`

### **5. Database Migration**
```bash
# Switch to PostgreSQL schema
cp packages/database/prisma/schema.prod.prisma packages/database/prisma/schema.prisma

# Deploy to production database
DATABASE_URL="your-railway-postgresql-url" npx prisma db push
```

### **6. Testing & Setup**
1. **Test OAuth**: Visit `https://admin.orbistech.dev` → Discord login
2. **Create Super Admin**: Update user role in database
3. **Create Test Alliance**: Use admin panel to authorize first alliance
4. **Test Tenant Access**: Visit `https://[alliance].orbistech.dev`

## 📋 Production URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Admin Panel** | `https://admin.orbistech.dev` | Super admin interface |
| **Main Domain** | `https://orbistech.dev` | Redirects to admin |
| **Alliance Portals** | `https://[name].orbistech.dev` | Tenant-specific dashboards |

## 🔐 Security Features

- **Multi-tenant isolation** with Row-Level Security
- **Encrypted API keys** and bot tokens
- **Discord OAuth** authentication
- **Subdomain-based** tenant separation
- **Alliance-specific** Discord bots

## 🤖 Discord Bot Deployment

After web apps are live:
1. **Railway deployment** for Discord bot manager
2. **Multi-instance architecture** with per-alliance bots
3. **Automatic scaling** based on active alliances

## 📊 Architecture Overview

```
admin.orbistech.dev (Admin Panel)
        ↓
    Super Admin
        ↓
   Authorizes Alliances
        ↓
alliance1.orbistech.dev ← Alliance 1 Admin → Discord Bot 1
alliance2.orbistech.dev ← Alliance 2 Admin → Discord Bot 2
alliance3.orbistech.dev ← Alliance 3 Admin → Discord Bot 3
```

## 🎉 Ready for Launch!

The system is architected and ready for production deployment. The multi-tenant isolation ensures complete data separation between alliances, while the Discord OAuth flow provides seamless authentication.

**Estimated deployment time: 30 minutes**