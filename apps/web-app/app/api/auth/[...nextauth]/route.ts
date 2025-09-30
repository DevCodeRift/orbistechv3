import NextAuth from 'next-auth';
import { getAuthOptions } from '../../auth-utils';

const handler = async (req: Request, context: any) => {
  const authOptions = getAuthOptions();
  return NextAuth(req, context, authOptions);
};

export { handler as GET, handler as POST };