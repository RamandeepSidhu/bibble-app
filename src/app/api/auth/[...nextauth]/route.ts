import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/api/token";
import ClientInstance from "@/lib/client";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 365 * 24 * 60 * 60,
  },
  secret: process.env.NEXT_AUTH_SECRET,
  pages: {
    signIn: "/login", // your portal login page
    error: "/login",  // redirect here on any auth error
  },
  providers: [
    CredentialProvider({
      name: "Credentials",
      credentials: { email: { label: "Email", type: "text" }, password: { label: "Password", type: "password" } },
      authorize: async (credentials) => {
        const { email, password } = credentials as any;
        let messageText = 'Login failed';

        try {
          const res: any = await ClientInstance.Auth.Login({ email, password });
          if (res.success && res.token) {
            const user = res.data;
            if(user?.isEmailVarify === false){
              messageText = 'EmailNotVerified';
              throw new Error("EmailNotVerified");
            }
            const cookieStore = await cookies();
            cookieStore.set(AUTH_TOKEN_KEY, res.token);
            cookieStore.set("email", user.email);

            return {
              id: user._id,
              name: user.name || "",
              email: user.email,
              role_id: user.role,
              username: user.username,
              isActive: !!user.isActive,
              status: user.status,
              createdAt: user.createdAt,
              image_link: user.profile_image || "/images/user.png",
              token: res.token,
              subscription: user?.subscription || {},
              country_code: user?.country_code || "",
              phone_number: user?.phone_number || "",
              isEmailVarify: user?.isEmailVarify,
            };
          }

          throw new Error(res.message || "Invalid credentials.");
        } catch (error: any) {
          if(error?.response?.data?.message==='Please varify your email!'){
            messageText = 'EmailNotVerified';
            throw new Error(messageText);
          }
          throw new Error(error?.response?.data?.message || messageText);
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
        session.user.role_id = token.role_id as string;
        session.user.username = token.username as string;
        session.user.isActive = token.isActive as boolean;
        session.user.status = token.status as string;
        session.user.createdAt = token.createdAt as string;
        session.user.image_link = token.image_link as string || token.image;
        session.user.phone_number = token.phone_number as string;
        session.user.country_code = token.country_code as string;
        session.user.token = token.token as string;
        session.user.subscription = token.subscription || {} as any;
        session.user.isEmailVarify = token.isEmailVarify as boolean;
        if (token.googleLoginError) {
          session.user.googleLoginError = token.googleLoginError;
        }
      }
      return session;
    },
  },
};

const authHandler = NextAuth(authOptions);
export { authHandler as GET, authHandler as POST };
