const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeSuperAdmin(discordId) {
  try {
    const user = await prisma.user.update({
      where: {
        discordId: discordId
      },
      data: {
        role: 'SUPER_ADMIN'
      }
    });

    console.log(`Successfully made user ${user.username} (${user.discordId}) a SUPER_ADMIN`);
    return user;
  } catch (error) {
    console.error('Error making user super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Usage: node scripts/make-superadmin.js YOUR_DISCORD_ID
const discordId = process.argv[2];
if (!discordId) {
  console.error('Please provide a Discord ID as an argument');
  console.error('Usage: node scripts/make-superadmin.js YOUR_DISCORD_ID');
  process.exit(1);
}

makeSuperAdmin(discordId).catch(console.error);