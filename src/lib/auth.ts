import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db as prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: (credentials.email as string).toLowerCase().trim() },
          });

          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            mustChangePassword: user.mustChangePassword,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. Initial login: attach user properties to JWT token.
      // Explicit casts here because Auth.js v5's callback typing for `user`
      // doesn't fully pick up the module augmentation in
      // src/types/next-auth.d.ts the way `token`/JWT does -- these values
      // are correct at runtime (they come straight from Prisma), this is
      // purely reconciling the callback's own type resolution.
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.department = (user.department ?? undefined) as string | undefined;
        token.mustChangePassword = user.mustChangePassword;
      }

      // 2. Handle explicit session updates (e.g. after changing password)
      if (trigger === "update" && session) {
        token.mustChangePassword = session.mustChangePassword;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? Role.DEPARTMENT_USER;
        session.user.department = ((token.department as string | undefined) ?? undefined) as string | undefined;
        session.user.mustChangePassword = (token.mustChangePassword as boolean) ?? false;
      }
      return session;
    },
  },
});