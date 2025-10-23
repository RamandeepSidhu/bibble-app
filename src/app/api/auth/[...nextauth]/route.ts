import NextAuth, { NextAuthOptions, Session, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Static user database for demo purposes
// Available users:
// 1. Admin: admin@example.com / 123456789 (role_id: 1 - Admin)
// 2. Regular User: user@example.com / user123 (role_id: 3 - Regular User)
const STATIC_USERS = [
  {
    id: "1",
    email: "admin@example.com",
    password: "123456789", // In real app, this would be hashed
    first_name: "Admin",
    last_name: "User",
    role_id: 1, // Admin role
    email_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    email: "user@example.com",
    password: "user123", // In real app, this would be hashed
    first_name: "Regular",
    last_name: "User",
    role_id: 3, // Regular user role
    email_verified: true,
    created_at: new Date().toISOString(),
  }
];

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXT_AUTH_SECRET || "bibble-app-secret-key-2024",
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      type: "credentials",
      credentials: {},
      authorize: async (credentials): Promise<User | null> => {
        const { email, password } = credentials as {
          email: string;
          password: string;
        };

        // Find user by email
        const user = STATIC_USERS.find(u => u.email === email);

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Check password (in real app, compare hashed passwords)
        if (user.password !== password) {
          throw new Error("Invalid email or password");
        }

        // Return user object for session
        return {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role_id: user.role_id,
          first_name: user.first_name,
          last_name: user.last_name,
          email_verified: user.email_verified,
          created_at: user.created_at,
        } as User;
      }
    }),
  ],

  callbacks: {
    async jwt({ token, trigger, user, session }: any) {
      if (trigger === "update" && session?.user) {
        return { ...token, ...session.user };
      }
      if (user) {
        return { ...token, ...user };
      }
      return token;
    },

    session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).name = token.name as string;
        (session.user as any).role_id = token.role_id as number;
        (session.user as any).first_name = token.first_name as string;
        (session.user as any).last_name = token.last_name as string;
        (session.user as any).email_verified = token.email_verified as boolean;
        (session.user as any).created_at = token.created_at as string;
      }
      return session;
    },
  },
};
const authHandler = NextAuth(authOptions);
export { authHandler as GET, authHandler as POST }; 