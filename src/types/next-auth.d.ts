import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string;
      jwt_token?: string;
    };
  }

  interface User {
    token?: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    jwt_token?: string;
    role: string;
  }
}
