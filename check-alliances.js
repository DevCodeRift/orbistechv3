const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAlliances() {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        users: true,
        _count: {
          select: {
            users: true,
            allianceMembers: true
          }
        }
      }
    });

    console.log('Current Alliances/Tenants:');
    console.log('========================');

    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.allianceName} (ID: ${tenant.allianceId})`);
      console.log(`   Subdomain: ${tenant.subdomain}`);
      console.log(`   Status: ${tenant.status}`);
      console.log(`   Discord Admin: ${tenant.discordAdminId}`);
      console.log(`   Has API Key: ${!!tenant.apiKeyEncrypted}`);
      console.log(`   Users: ${tenant._count.users}`);
      console.log(`   Members: ${tenant._count.allianceMembers}`);
      console.log(`   URL: https://${tenant.subdomain}.orbistech.dev`);
      console.log('   ---');
    });

    if (tenants.length === 0) {
      console.log('No alliances found in database.');
    }

  } catch (error) {
    console.error('Error checking alliances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAlliances();