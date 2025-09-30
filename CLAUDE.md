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
- 11:14:44.772 Running build in Washington, D.C., USA (East) – iad1
11:14:44.773 Build machine configuration: 2 cores, 8 GB
11:14:44.787 Cloning github.com/DevCodeRift/orbistechv3 (Branch: main, Commit: adf8fae)
11:14:44.924 Previous build caches not available
11:14:45.067 Cloning completed: 278.000ms
11:14:45.447 Running "vercel build"
11:14:45.881 Vercel CLI 48.1.6
11:14:46.046 > Detected Turbo. Adjusting default settings...
11:14:46.210 Running "install" command: `npm install`...
11:14:47.902 npm warn workspaces @orbistech/web-app in filter set, but no workspace folder present
11:14:49.523 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
11:14:50.099 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
11:14:50.246 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
11:14:50.579 npm warn deprecated formidable@1.2.6: Please upgrade to latest, formidable@v2 or formidable@v3! Check these notes: https://bit.ly/2ZEqIau
11:14:50.924 npm warn deprecated crypto@1.0.1: This package is no longer supported. It's now a built-in Node module. If you've depended on crypto, you should switch to the one that's built-in.
11:14:51.331 npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
11:14:51.354 npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
11:14:51.488 npm warn deprecated glob@7.1.7: Glob versions prior to v9 are no longer supported
11:14:52.033 npm warn deprecated superagent@6.1.0: Please upgrade to superagent v10.2.2+, see release notes at https://github.com/forwardemail/superagent/releases/tag/v10.2.2 - maintenance is supported by Forward Email @ https://forwardemail.net
11:14:53.343 npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
11:15:01.679 
11:15:01.680 added 454 packages, and audited 461 packages in 15s
11:15:01.680 
11:15:01.681 159 packages are looking for funding
11:15:01.681   run `npm fund` for details
11:15:01.681 
11:15:01.681 found 0 vulnerabilities
11:15:01.723 Detected Next.js version: 14.2.33
11:15:01.724 Running "npm run build"
11:15:01.863 
11:15:01.863 > @orbistech/web-app@0.1.0 build
11:15:01.866 > cd ../../packages/database && prisma generate && cd ../../apps/web-app && next build
11:15:01.866 
11:15:02.322 Prisma schema loaded from prisma/schema.prisma
11:15:02.822 
11:15:02.823 ✔ Generated Prisma Client (v5.22.0) to ./../../node_modules/@prisma/client in 199ms
11:15:02.823 
11:15:02.823 Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
11:15:02.823 
11:15:02.823 Tip: Want to turn off tips and other hints? https://pris.ly/tip-4-nohints
11:15:02.823 
11:15:02.886 ┌─────────────────────────────────────────────────────────┐
11:15:02.888 │  Update available 5.22.0 -> 6.16.2                      │
11:15:02.888 │                                                         │
11:15:02.888 │  This is a major update - please follow the guide at    │
11:15:02.889 │  https://pris.ly/d/major-version-upgrade                │
11:15:02.889 │                                                         │
11:15:02.889 │  Run the following to update                            │
11:15:02.889 │    npm i --save-dev prisma@latest                       │
11:15:02.890 │    npm i @prisma/client@latest                          │
11:15:02.890 └─────────────────────────────────────────────────────────┘
11:15:03.611 Attention: Next.js now collects completely anonymous telemetry regarding usage.
11:15:03.611 This information is used to shape Next.js' roadmap and prioritize features.
11:15:03.612 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
11:15:03.612 https://nextjs.org/telemetry
11:15:03.612 
11:15:03.667   ▲ Next.js 14.2.33
11:15:03.667 
11:15:03.718    Creating an optimized production build ...
11:15:19.887  ✓ Compiled successfully
11:15:19.888    Linting and checking validity of types ...
11:15:25.153    Collecting page data ...
11:15:25.740    Generating static pages (0/12) ...
11:15:26.673    Generating static pages (3/12) 
11:15:26.867    Generating static pages (6/12) 
11:15:26.988    Generating static pages (9/12) 
11:15:27.102  ✓ Generating static pages (12/12)
11:15:27.353    Finalizing page optimization ...
11:15:27.353    Collecting build traces ...
11:15:32.466 
11:15:32.481 Route (app)                              Size     First Load JS
11:15:32.482 ┌ ○ /_not-found                          873 B          88.2 kB
11:15:32.482 ├ ƒ /admin                               2.69 kB        99.7 kB
11:15:32.482 ├ ○ /admin/login                         1.68 kB        98.6 kB
11:15:32.482 ├ ƒ /api/admin/tenants                   0 B                0 B
11:15:32.482 ├ ƒ /api/auth/[...nextauth]              0 B                0 B
11:15:32.482 ├ ƒ /api/setup/api-key                   0 B                0 B
11:15:32.482 ├ ƒ /api/setup/bot-token                 0 B                0 B
11:15:32.482 ├ ○ /main                                137 B          87.4 kB
11:15:32.482 ├ ƒ /tenant/dashboard                    1.96 kB        98.9 kB
11:15:32.482 ├ ƒ /tenant/login                        1.75 kB        98.7 kB
11:15:32.482 └ ƒ /tenant/setup                        1.88 kB        89.2 kB
11:15:32.482 + First Load JS shared by all            87.3 kB
11:15:32.482   ├ chunks/1dd3208c-1bfa912d86ba96c5.js  53.6 kB
11:15:32.482   ├ chunks/528-7252e02374cfc55c.js       31.7 kB
11:15:32.482   └ other shared chunks (total)          1.95 kB
11:15:32.482 
11:15:32.482 
11:15:32.482 ƒ Middleware                             48 kB
11:15:32.482 
11:15:32.483 ○  (Static)   prerendered as static content
11:15:32.483 ƒ  (Dynamic)  server-rendered on demand
11:15:32.483 
11:15:32.517 Error: The file "/vercel/path0/apps/web-app/apps/web-app/.next/routes-manifest.json" couldn't be found. This is often caused by a misconfiguration in your project.
11:15:32.517 Learn More: https://err.sh/vercel/vercel/now-next-routes-manifest