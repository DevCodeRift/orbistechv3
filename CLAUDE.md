# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OrbistechV3 is a multi-tenant Politics and War alliance management system with:
- **Unified Web App** (`apps/web-app`): Single Next.js app handling all web routes via middleware
  - `domain.com` → Landing page
  - `admin.domain.com` → Super admin interface
  - `*.domain.com` → Alliance-specific tenant dashboards
- **Discord Bot** (`apps/discord-bot`): Multi-tenant bot manager with alliance-specific instances

## Architecture

This is a **multi-tenant monorepo** using **Turborepo** with row-level security for data isolation. Each alliance gets:
- Dedicated subdomain (`alliancename.domain.com`)
- Isolated database access via row-level security policies
- Dedicated Discord bot instance
- Encrypted API key storage for Politics & War integration

### Key Technologies
- **Turborepo**: Monorepo management
- **Next.js 14**: Frontend applications with App Router
- **Prisma**: Database ORM with SQLite (dev) / PostgreSQL (prod)
- **Discord.js**: Bot framework
- **pnwkit**: Politics & War API wrapper
- **NextAuth**: Discord OAuth authentication
- **Tailwind CSS + shadcn/ui**: Styling and components

## Common Development Commands

### Root Level Commands
```bash
# Development (all apps)
npm run dev

# Development (specific apps)
npm run dev:tenant    # Tenant app on port 3001
npm run dev:admin     # Admin app on port 3000
npm run dev:bot       # Discord bot

# Building and testing
npm run build         # Build all apps
npm run lint          # Lint all apps
npm run type-check    # TypeScript checking
npm run test          # Run tests

# Database operations
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run migrations

# Initial setup
npm run setup         # Run setup script
```

### Individual App Commands
Each app has its own package.json with standard Next.js commands:
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - ESLint
- `npm run type-check` - TypeScript validation

### Database Package
Located in `packages/database/`:
- `npm run db:studio` - Open Prisma Studio
- `npm run db:generate` - Generate client
- `npm run db:push` - Push schema changes
- `npm run db:migrate` - Run migrations

## Project Structure

```
orbistechv3/
├── apps/
│   ├── web-app/            # Unified Next.js app (all domain routing)
│   │   ├── app/
│   │   │   ├── (admin)/    # Admin routes (/admin/*)
│   │   │   ├── (tenant)/   # Tenant routes (subdomain-based)
│   │   │   └── (main)/     # Landing page routes
│   │   ├── middleware.ts   # Subdomain routing logic
│   │   └── package.json
│   ├── discord-bot/        # Multi-tenant bot manager (Railway)
│   └── [legacy apps]/      # tenant-app, admin-app (deprecated)
├── packages/
│   ├── database/           # Shared Prisma schema and client
│   ├── auth/               # Discord OAuth shared logic
│   ├── encryption/         # API key encryption utilities
│   ├── pnw-api/           # Politics & War API wrapper
│   └── ui/                # Shared UI components
├── docs/                  # Architecture and setup documentation
└── scripts/              # Setup and utility scripts
```

## Multi-Tenant Architecture

### Database Design
- **Row-Level Security (RLS)**: All tenant data is isolated via PostgreSQL RLS policies
- **Tenant Context**: Each request sets `app.current_tenant_id` for automatic filtering
- **Shared Schema**: Single database with tenant_id foreign keys on all tenant-specific tables

### Key Models (Prisma)
- `Tenant`: Core alliance/tenant configuration with encrypted API keys
- `User`: Discord users associated with tenants
- `AllianceMember`: Politics & War member data per tenant
- `War`: War tracking data per tenant
- `TenantSettings`: Per-alliance configuration

### Subdomain Routing
Next.js middleware handles all subdomain resolution in a single app:
- `domain.com` → Landing page routes
- `admin.domain.com` → Admin interface routes (`/admin/*`)
- `alliancename.domain.com` → Tenant dashboard routes with alliance context

## Politics & War Integration

### API Usage
- Uses `pnwkit` wrapper for Politics & War API v3
- Each tenant has encrypted API key storage
- Rate limiting and caching implemented per tenant
- Supports alliance member sync, war tracking, and economic data

### Bot Architecture
- Single bot manager spawns tenant-specific bot instances
- Each alliance gets dedicated Discord bot with isolated commands
- Guild-specific command registration and permission handling

## Development Notes

### Database Development
- Development uses SQLite (`packages/dev.db`)
- Production uses PostgreSQL with RLS policies
- Always run `npm run db:generate` after schema changes
- Use `npm run db:push` for development, `npm run db:migrate` for production

### Environment Variables
Each app requires its own `.env.local` file. See `docs/SETUP_GUIDE.md` for complete setup instructions.

### Shared Packages
All packages in `packages/` are referenced by apps using workspace syntax:
- `@orbistech/database` - Prisma client and types
- `@orbistech/auth` - Discord OAuth logic
- `@orbistech/encryption` - API key encryption
- `@orbistech/pnw-api` - Politics & War API wrapper
- `@orbistech/ui` - Shared components

### Testing and Deployment
- **Single Vercel deployment** for unified web-app (handles all domains)
- **Railway deployment** for discord-bot and PostgreSQL database
- Middleware-based routing eliminates need for separate deployments
- Turbo build pipeline handles dependencies automatically
- Always run lint and type-check before commits