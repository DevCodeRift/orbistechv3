# Multi-Tenant Alliance Management Architecture

## System Overview

This system provides isolated alliance management where:
1. **Super Admin** authorizes alliances and assigns Discord admin IDs
2. **Alliance Admins** set API keys and manage their alliance
3. **Subdomains** provide isolated access (`alliancename.domain.com`)
4. **Discord Bots** are alliance-specific instances
5. **Data Isolation** ensures alliances cannot access each other's data

## Architecture Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Super Admin   │    │ Alliance Admin  │    │  Alliance Bot   │
│   (Main App)    │───►│ (Subdomain)     │◄──►│ (Discord Guild) │
│ domain.com/admin│    │name.domain.com  │    │  Bot Instance   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Shared Database│
                    │  (Tenant Isolated)│
                    │   PostgreSQL    │
                    └─────────────────┘
```

## Database Schema Design

### Multi-Tenant Strategy: Row-Level Security (RLS)

```sql
-- Core tenant table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alliance_id INTEGER UNIQUE NOT NULL,
    alliance_name VARCHAR(100) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    discord_admin_id VARCHAR(20) NOT NULL,
    api_key_encrypted TEXT,
    discord_guild_id VARCHAR(20),
    discord_bot_token_encrypted TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    authorized_by VARCHAR(20),
    authorized_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table with tenant association
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_id VARCHAR(20) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    avatar VARCHAR(255),
    email VARCHAR(255),
    tenant_id UUID REFERENCES tenants(id),
    role VARCHAR(20) DEFAULT 'member',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Alliance members (P&W data)
CREATE TABLE alliance_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    nation_id INTEGER NOT NULL,
    nation_name VARCHAR(100) NOT NULL,
    leader_name VARCHAR(100) NOT NULL,
    discord_id VARCHAR(20),
    position VARCHAR(50),
    position_id INTEGER,
    cities INTEGER,
    score DECIMAL(10,2),
    last_active TIMESTAMP,
    joined_alliance TIMESTAMP,
    data_last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, nation_id)
);

-- Wars table (tenant isolated)
CREATE TABLE wars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    war_id INTEGER NOT NULL,
    attacker_id INTEGER NOT NULL,
    defender_id INTEGER NOT NULL,
    war_type VARCHAR(50),
    status VARCHAR(20),
    date_started TIMESTAMP,
    date_ended TIMESTAMP,
    data_last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, war_id)
);

-- Settings per tenant
CREATE TABLE tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL UNIQUE,
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_interval_minutes INTEGER DEFAULT 30,
    war_alerts_enabled BOOLEAN DEFAULT true,
    member_alerts_enabled BOOLEAN DEFAULT true,
    inactivity_threshold_days INTEGER DEFAULT 7,
    settings_json JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE alliance_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wars ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access data for their tenant
CREATE POLICY tenant_isolation_members ON alliance_members
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_wars ON wars
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_settings ON tenant_settings
    FOR ALL TO authenticated
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

## Application Architecture

### 1. Main Application (domain.com)
- **Super Admin Interface**: Authorize alliances, manage system
- **Landing Page**: Public info about the service
- **Documentation**: API docs, setup guides

### 2. Tenant Applications (subdomain.domain.com)
- **Alliance Dashboard**: Member management, analytics
- **Discord OAuth**: Login and role management
- **API Key Management**: Secure P&W API key storage
- **Bot Management**: Discord bot configuration

### 3. Discord Bot Architecture
```typescript
// Bot instances per tenant
interface BotInstance {
  tenantId: string;
  guildId: string;
  client: Discord.Client;
  apiKey: string;
  pnwKit: PnWKit;
}

// Bot manager
class BotManager {
  private instances: Map<string, BotInstance> = new Map();

  async createInstance(tenant: Tenant): Promise<BotInstance> {
    const client = new Discord.Client({ intents: [...] });
    const pnwKit = new PnWKit(tenant.apiKey);

    const instance = {
      tenantId: tenant.id,
      guildId: tenant.discordGuildId,
      client,
      apiKey: tenant.apiKey,
      pnwKit
    };

    await this.setupCommands(instance);
    await client.login(tenant.botToken);

    this.instances.set(tenant.id, instance);
    return instance;
  }
}
```

## Implementation Phases

### Phase 1: Core Infrastructure
1. **Database Setup**: PostgreSQL with RLS policies
2. **Monorepo Structure**: Apps and shared packages
3. **Subdomain Routing**: Next.js middleware for tenant resolution
4. **Basic Auth**: Discord OAuth integration

### Phase 2: Tenant Management
1. **Super Admin Panel**: Alliance authorization interface
2. **Tenant Onboarding**: API key setup flow
3. **Database Isolation**: RLS implementation and testing
4. **Subdomain Logic**: Dynamic tenant resolution

### Phase 3: Discord Integration
1. **Multi-Bot Architecture**: Bot manager and instances
2. **Guild-Specific Commands**: Tenant-isolated bot functionality
3. **Invite System**: Alliance-specific bot invites
4. **Permission Management**: Role-based access control

### Phase 4: Alliance Features
1. **Member Sync**: P&W API integration per alliance
2. **Dashboard**: Alliance-specific analytics
3. **Alerts System**: War and member notifications
4. **Settings Management**: Per-alliance configuration

## Security Considerations

### Data Isolation
- **Row-Level Security**: Database-enforced tenant isolation
- **API Middleware**: Tenant context validation on every request
- **Encrypted Storage**: API keys and bot tokens encrypted at rest
- **Audit Logging**: All cross-tenant operations logged

### Access Control
- **Super Admin**: System-wide access for alliance authorization
- **Alliance Admin**: Full access to their alliance data only
- **Alliance Members**: Read-only access to their alliance
- **Discord Integration**: Role sync between Discord and web app

### Bot Security
- **Token Isolation**: Each alliance has separate bot token
- **Command Scoping**: Bot commands only work in authorized guild
- **Rate Limiting**: Per-alliance API rate limiting
- **Error Isolation**: Bot failures don't affect other alliances

## Subdomain Implementation

### DNS Configuration
```
*.domain.com -> Load Balancer/CDN
domain.com -> Main App
admin.domain.com -> Super Admin Panel
alliancename.domain.com -> Tenant App
```

### Next.js Middleware
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];

  // Main domain routes
  if (subdomain === 'domain' || subdomain === 'www') {
    return NextResponse.rewrite(new URL('/main', request.url));
  }

  // Super admin routes
  if (subdomain === 'admin') {
    return NextResponse.rewrite(new URL('/admin', request.url));
  }

  // Tenant routes
  const tenantResponse = NextResponse.rewrite(
    new URL(`/tenant/${subdomain}${request.nextUrl.pathname}`, request.url)
  );

  tenantResponse.headers.set('x-tenant-subdomain', subdomain);
  return tenantResponse;
}
```

## Development Workflow

### Project Structure
```
orbistechv3/
├── apps/
│   ├── main-app/              # Main domain (domain.com)
│   ├── tenant-app/            # Subdomain app (*.domain.com)
│   ├── admin-app/             # Super admin (admin.domain.com)
│   └── discord-bot/           # Multi-tenant bot manager
├── packages/
│   ├── database/              # Shared Prisma schema
│   ├── auth/                  # Discord OAuth shared logic
│   ├── pnw-api/              # P&W API wrapper per tenant
│   ├── ui/                    # Shared UI components
│   └── encryption/           # API key encryption utilities
└── docs/
```

This architecture ensures complete isolation between alliances while providing a seamless experience for each tenant through their dedicated subdomain and Discord bot instance.