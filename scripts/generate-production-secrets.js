#!/usr/bin/env node

const crypto = require('crypto');

console.log('🔐 Production Secrets Generator for orbistech.dev\n');

// Generate production secrets
const nextAuthSecret = crypto.randomBytes(32).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('hex');

console.log('=== COPY THESE TO VERCEL ENVIRONMENT VARIABLES ===\n');

console.log('NEXTAUTH_SECRET:');
console.log(nextAuthSecret);
console.log('');

console.log('ENCRYPTION_KEY:');
console.log(encryptionKey);
console.log('');

console.log('=== DISCORD OAUTH SETUP ===');
console.log('1. Go to https://discord.com/developers/applications');
console.log('2. Create application: "OrbisTech Alliance Management"');
console.log('3. Add these OAuth redirect URLs:');
console.log('   - https://admin.orbistech.dev/api/auth/callback/discord');
console.log('   - https://*.orbistech.dev/api/auth/callback/discord');
console.log('   - http://localhost:3001/api/auth/callback/discord (dev)');
console.log('   - http://localhost:3002/api/auth/callback/discord (dev)');
console.log('4. Copy Client ID and Client Secret to Vercel env vars');
console.log('');

console.log('=== VERCEL DEPLOYMENT ===');
console.log('1. Connect GitHub repo to Vercel');
console.log('2. Set up two projects:');
console.log('   - Admin App: Root = apps/admin-app, Domain = admin.orbistech.dev');
console.log('   - Tenant App: Root = apps/tenant-app, Domain = *.orbistech.dev');
console.log('3. Configure environment variables in both projects');
console.log('4. Set up custom domain: orbistech.dev');
console.log('');

console.log('=== DATABASE SETUP ===');
console.log('1. Create Railway PostgreSQL database');
console.log('2. Update DATABASE_URL in both Vercel projects');
console.log('3. Run: npx prisma db push');
console.log('');

console.log('=== PRODUCTION CHECKLIST ===');
console.log('□ Discord application created with correct URLs');
console.log('□ PostgreSQL database provisioned');
console.log('□ Vercel projects deployed');
console.log('□ Custom domain configured');
console.log('□ Environment variables set');
console.log('□ Database schema pushed');
console.log('□ First OAuth login tested');
console.log('□ Super admin user created');
console.log('');