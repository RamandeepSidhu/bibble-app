import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role_id: number;
      jwt_token?: string;
    };
  }

  interface User {
    role_id: number;
    token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role_id: number;
    jwt_token?: string;
  }
}
