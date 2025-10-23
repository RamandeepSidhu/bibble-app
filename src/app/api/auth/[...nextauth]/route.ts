import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/api/token";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 365 * 24 * 60 * 60,
  },
  secret: process.env.NEXT_AUTH_SECRET,
  providers: [
    CredentialProvider({
      name: "Credentials",
      credentials: { email: { label: "Email", type: "text" }, password: { label: "Password", type: "password" } },
       authorize: async (credentials) => {
         const { email, password } = credentials as any;

         try {

           const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
             method: "POST",
             headers: {
               "Content-Type": "application/json",
             },
             body: JSON.stringify({
               email: email,
               password: password,
             }),
           });


           if (!response.ok) {
             const errorText = await response.text();
             throw new Error(`Network error: ${response.status} - ${errorText}`);
           }

           const result = await response.json();

           if (!result.success) {
             throw new Error(result.message || "Login failed");
           }

           const user = result.data;

           // Set cookies for token storage
           const cookieStore = await cookies();
           cookieStore.set(AUTH_TOKEN_KEY, result.token);
           cookieStore.set("email", user.email);

           return {
             id: user._id || user.id,
             name: user.name || "",
             email: user.email,
             role: user.role,
             username: user.username || "",
             isActive: !!user.isActive,
             status: user.status,
             createdAt: user.createdAt,
             token: result.token,
             country_code: user?.country_code || "",
           };
         } catch (error: any) {
           console.error("Authentication error:", error);
           throw new Error(error.message || "Login failed");
         }
       },
    }),

    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    })
  ],

  callbacks: {
    async jwt({ token, trigger, user, account, session }) {
      if (trigger === "update") {
        return { ...token, ...session.user };
      }
      return { ...token, ...user };
    },

    session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
        session.user.isActive = token.isActive as boolean;
        session.user.status = token.status as string;
        session.user.createdAt = token.createdAt as string;
        session.user.image_link = token.image_link as string || token.image;
        session.user.phone_number = token.phone_number as string;
        session.user.country_code = token.country_code as string;
        session.user.token = token.token as string;
      }
      return session;
    },
  },
};

const authHandler = NextAuth(authOptions);
export { authHandler as GET, authHandler as POST };
