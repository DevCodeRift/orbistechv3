# Vercel Domain Configuration for Multi-Tenant Setup

## Current Setup
- Main domain: `www.orbistech.dev`
- Alliance subdomain: `rose.orbistech.dev`
- Admin subdomain: `admin.orbistech.dev`

## Required Vercel Configuration

### 1. Add Domains in Vercel Dashboard
Go to your Vercel project settings and add these domains:
- `rose.orbistech.dev`
- `admin.orbistech.dev`
- `*.orbistech.dev` (wildcard for future alliances)

### 2. DNS Configuration
In your domain registrar (where orbistech.dev is managed), add:
```
Type: CNAME
Name: rose
Value: cname.vercel-dns.com

Type: CNAME
Name: admin
Value: cname.vercel-dns.com

Type: CNAME
Name: *
Value: cname.vercel-dns.com
```

### 3. Vercel Rewrites (already configured in middleware.ts)
Your middleware is already set up to handle subdomain routing properly.

## Testing Without Domain Setup

For immediate testing, you can:
1. Use localhost with modified hosts file
2. Test the main domain with path-based routing
3. Use Vercel preview URLs

## Local Testing Setup
Add to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 rose.localhost
127.0.0.1 admin.localhost
```

Then access:
- http://rose.localhost:3000 (alliance subdomain)
- http://admin.localhost:3000 (admin panel)
- http://localhost:3000 (main landing page)