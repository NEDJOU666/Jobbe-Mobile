const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('DATABASE STATUS CHECK');
    console.log('═══════════════════════════════════════════════════════\n');

    // Check Users
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({ take: 5, select: { id: true, name: true, email: true, role: true } });
    console.log(`👤 USERS: ${userCount} total`);
    if (users.length > 0) {
      console.log('   Sample:', users);
    } else {
      console.log('   ❌ No users in database');
    }

    // Check Firms
    const firmCount = await prisma.firms.count();
    const firms = await prisma.firms.findMany({ take: 5, select: { id: true, name: true, city: true, status: true } });
    console.log(`\n🏢 FIRMS: ${firmCount} total`);
    if (firms.length > 0) {
      console.log('   Sample:', firms);
    } else {
      console.log('   ❌ No firms in database');
    }

    // Check Posts
    const postCount = await prisma.post.count();
    const posts = await prisma.post.findMany({ 
      take: 5, 
      select: { id: true, title: true, status: true, employmentType: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`\n📋 POSTS (Jobs): ${postCount} total`);
    if (posts.length > 0) {
      console.log('   Sample:', posts);
      const publishedCount = await prisma.post.count({ where: { status: 'PUBLISHED' } });
      console.log(`   Published: ${publishedCount}, Draft: ${postCount - publishedCount}`);
    } else {
      console.log('   ❌ No posts/jobs in database');
    }

    // Check Applications
    const appCount = await prisma.application.count();
    const apps = await prisma.application.findMany({ 
      take: 5,
      select: { id: true, post_id: true, user_id: true, firm_id: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    console.log(`\n📤 APPLICATIONS: ${appCount} total`);
    if (apps.length > 0) {
      console.log('   Sample:', apps);
    } else {
      console.log('   ❌ No applications in database');
    }

    // Check Saved Posts
    const savedCount = await prisma.savedPost.count();
    console.log(`\n❤️  SAVED POSTS: ${savedCount} total`);

    // Check Notifications
    const notifCount = await prisma.notification.count();
    const notifs = await prisma.notification.findMany({ take: 3, select: { id: true, user_id: true, type: true, title: true } });
    console.log(`\n🔔 NOTIFICATIONS: ${notifCount} total`);
    if (notifs.length > 0) {
      console.log('   Sample:', notifs);
    }

    // Check Credits
    const creditCount = await prisma.userCredit.count();
    const credits = await prisma.userCredit.findMany({ take: 3, select: { user_id: true, balance: true } });
    console.log(`\n💳 USER CREDITS: ${creditCount} accounts with balance`);
    if (credits.length > 0) {
      console.log('   Sample:', credits);
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Database Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
