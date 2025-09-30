#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Pre-deployment Checklist\n');

const checks = [];

// Check if .gitignore exists
if (fs.existsSync(path.join(__dirname, '..', '.gitignore'))) {
  checks.push({ name: '✅ .gitignore file exists', status: 'pass' });
} else {
  checks.push({ name: '❌ .gitignore file missing', status: 'fail' });
}

// Check for environment example files
const envExamples = [
  'apps/web-app/.env.example',
  'apps/discord-bot/.env.example'
];

envExamples.forEach(envPath => {
  const fullPath = path.join(__dirname, '..', envPath);
  if (fs.existsSync(fullPath)) {
    checks.push({ name: `✅ ${envPath} exists`, status: 'pass' });
  } else {
    checks.push({ name: `❌ ${envPath} missing`, status: 'fail' });
  }
});

// Check for production environment examples
const prodEnvExamples = [
  'apps/web-app/.env.production.example',
  'apps/discord-bot/.env.production.example'
];

prodEnvExamples.forEach(envPath => {
  const fullPath = path.join(__dirname, '..', envPath);
  if (fs.existsSync(fullPath)) {
    checks.push({ name: `✅ ${envPath} exists`, status: 'pass' });
  } else {
    checks.push({ name: `❌ ${envPath} missing`, status: 'fail' });
  }
});

// Check for critical files
const criticalFiles = [
  'package.json',
  'turbo.json',
  'vercel.json',
  'packages/database/prisma/schema.prisma',
  'DEPLOYMENT_GUIDE.md'
];

criticalFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    checks.push({ name: `✅ ${filePath} exists`, status: 'pass' });
  } else {
    checks.push({ name: `❌ ${filePath} missing`, status: 'fail' });
  }
});

// Check if there are .env.local files that might be committed accidentally
const envLocalFiles = [
  'apps/web-app/.env.local',
  'apps/discord-bot/.env.local',
  '.env.local'
];

envLocalFiles.forEach(envPath => {
  const fullPath = path.join(__dirname, '..', envPath);
  if (fs.existsSync(fullPath)) {
    checks.push({ name: `⚠️  ${envPath} exists (ensure not committed)`, status: 'warning' });
  }
});

// Display results
console.log('Checklist Results:');
checks.forEach(check => {
  console.log(check.name);
});

const failures = checks.filter(c => c.status === 'fail');
const warnings = checks.filter(c => c.status === 'warning');

console.log('\n📊 Summary:');
console.log(`✅ Passed: ${checks.filter(c => c.status === 'pass').length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`❌ Failed: ${failures.length}`);

if (failures.length > 0) {
  console.log('\n🚨 Deployment blocked! Fix the failing checks above.');
  process.exit(1);
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings detected. Review before deploying.');
}

console.log('\n✅ Ready for deployment!');
console.log('\n📖 Next steps:');
console.log('1. Follow DEPLOYMENT_GUIDE.md');
console.log('2. Set up Railway PostgreSQL database');
console.log('3. Deploy to Vercel and Railway');
console.log('4. Configure environment variables');
console.log('5. Test your deployments');