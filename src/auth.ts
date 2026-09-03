// next-auth.d.ts
import { Role } from "@prisma/client";


declare module "next-auth" {
  interface User {
    department?: string | null;
    role?: string | Role | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      department?: string;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    department?: string;
    role?: Role;
  }
}
