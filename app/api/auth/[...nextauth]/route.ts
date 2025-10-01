import NextAuth from 'next-auth';
import { authOptions } from '../../../auth-utils';

// Debug logging
console.log('NextAuth initializing with options:', {
  providersCount: authOptions.providers?.length || 0,
  hasSecret: !!authOptions.secret,
  hasClientId: !!process.env.DISCORD_CLIENT_ID,
  hasClientSecret: !!process.env.DISCORD_CLIENT_SECRET,
});

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };