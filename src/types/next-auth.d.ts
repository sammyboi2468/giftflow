// src/types/next-auth.d.ts
import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";



declare module "next-auth" {
  interface User {
    id?: string;
    role?: Role;
    department?: string | null;
    mustChangePassword?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      department?: string | null;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    department?: string | null;
    mustChangePassword?: boolean;
  }
}