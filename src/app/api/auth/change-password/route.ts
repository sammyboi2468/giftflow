import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await auth();

  // 1. Guard against unauthenticated requests
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || typeof currentPassword !== "string") {
    return NextResponse.json(
      { message: "Current password is required." },
      { status: 400 }
    );
  }

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { message: "New password must be at least 8 characters long." },
      { status: 400 }
    );
  }

  // 2. Build strictly typed query conditions without 'null'
  const conditions = [];
  if (session.user.id) {
    conditions.push({ id: session.user.id });
  }
  if (session.user.email) {
    conditions.push({ email: session.user.email });
  }

  // 3. Query user record safely
  const dbUser = await db.user.findFirst({
    where: {
      OR: conditions,
    },
  });

  if (!dbUser || !dbUser.password) {
    return NextResponse.json(
      { message: "User account or password record invalid" },
      { status: 400 }
    );
  }

  // 4. Validate current password
  const isValid = await bcrypt.compare(currentPassword.trim(), dbUser.password);
  if (!isValid) {
    return NextResponse.json(
      { message: "Incorrect current password." },
      { status: 400 }
    );
  }

  // 5. Update password in database
  const newHashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { id: dbUser.id },
    data: {
      password: newHashedPassword,
      mustChangePassword: false,
    },
  });

  return NextResponse.json({ message: "Password updated successfully" });
}