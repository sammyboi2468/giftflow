"use server";

import { auth } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function changePasswordAction(formData: FormData) {
  const session = await auth();

  console.log("--- CHANGE PASSWORD DEBUG ---");
  console.log("Session User:", session?.user);

  if (!session?.user?.email) {
    return { error: "Unauthorized session. Please log in again." };
  }

  const currentPassword = (formData.get("currentPassword") as string) || "";
  const newPassword = (formData.get("newPassword") as string) || "";

  console.log("Submitted currentPassword:", JSON.stringify(currentPassword));

  // 1. Fetch user directly from Neon DB
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase().trim() },
  });

  if (!dbUser) {
    console.log("ERROR: User not found in DB for email:", session.user.email);
    return { error: "User record not found." };
  }

  console.log("DB Stored Password Hash:", dbUser.password);

  // 2. Validate current password
  const isValid = await bcrypt.compare(currentPassword, dbUser.password || "");
  console.log("Bcrypt compare result:", isValid);
  console.log("----------------------------");

  if (!isValid) {
    return { error: "Incorrect current password." };
  }

  // 3. Hash new password and update DB
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      password: hashedPassword,
      mustChangePassword: false,
    },
  });

  return { success: true };
}