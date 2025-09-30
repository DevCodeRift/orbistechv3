#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up OrbisTech v3 Development Environment\n');

// Check if running in production mode
const isProduction = process.argv.includes('--production');

// Generate required secrets
const nextAuthSecret = crypto.randomBytes(32).toString('base64url');
const encryptionKey = crypto.randomBytes(16).toString('hex'); // 32 chars for AES-256

console.log('Generated secrets:');
console.log('NEXTAUTH_SECRET:', nextAuthSecret);
console.log('ENCRYPTION_KEY:', encryptionKey);
console.log('');

if (isProduction) {
  console.log('⚠️  Production mode detected!');
  console.log('Copy these values to your deployment environment variables.');
  console.log('Do NOT commit production secrets to git.\n');
}

// Template for .env.local
const envTemplate = `# Auto-generated environment configuration
# Generated on: ${new Date().toISOString()}

# Database Configuration (UPDATE THIS)
DATABASE_URL="postgresql://username:password@localhost:5432/orbistechv3"

# NextAuth Configuration
NEXTAUTH_SECRET="${nextAuthSecret}"

# Discord OAuth Configuration (GET FROM DISCORD DEVELOPER PORTAL)
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"

# Encryption Key for API Keys and Bot Tokens
ENCRYPTION_KEY="${encryptionKey}"

# Node Environment
NODE_ENV="development"
`;

// Create .env.local files for each app
const apps = [
  { name: 'web-app', port: '3000' },
  { name: 'discord-bot', port: null }
];

apps.forEach(app => {
  const envPath = path.join(__dirname, '..', 'apps', app.name, '.env.local');
  let appEnv = envTemplate;

  if (app.port) {
    appEnv = appEnv.replace('NEXTAUTH_SECRET=', `NEXTAUTH_URL="http://localhost:${app.port}"\nNEXTAUTH_SECRET=`);
  }

  if (app.name === 'discord-bot') {
    // Discord bot doesn't need NextAuth or Discord OAuth
    appEnv = `# Auto-generated environment configuration
# Generated on: ${new Date().toISOString()}

# Database Configuration (UPDATE THIS)
DATABASE_URL="postgresql://username:password@localhost:5432/orbistechv3"

# Encryption Key for API Keys and Bot Tokens
ENCRYPTION_KEY="${encryptionKey}"

# Node Environment
NODE_ENV="development"

# Discord Application ID (GET FROM DISCORD DEVELOPER PORTAL)
DISCORD_APPLICATION_ID="your-discord-application-id"
`;
  }

  if (!isProduction) {
    fs.writeFileSync(envPath, appEnv);
    console.log(`✅ Created ${app.name}/.env.local`);
  }
});

if (isProduction) {
  console.log('\n🔐 Production Setup:');
  console.log('1. Add these secrets to your deployment environment variables');
  console.log('2. Set up PostgreSQL database (Railway recommended)');
  console.log('3. Configure Discord OAuth with production URLs');
  console.log('4. Deploy to Vercel (web apps) and Railway (bot)');
  console.log('\nSee DEPLOYMENT_GUIDE.md for detailed instructions.');
} else {
  console.log('\n📝 Next steps:');
  console.log('1. Update DATABASE_URL in all .env.local files');
  console.log('2. Create Discord application and update OAuth credentials');
  console.log('3. Run: npm run db:push');
  console.log('4. Start development servers with: npm run dev');
  console.log('\nSee docs/SETUP_GUIDE.md for detailed instructions.');
}

console.log('\n💡 Tip: Run "npm run setup -- --production" to generate production secrets.');