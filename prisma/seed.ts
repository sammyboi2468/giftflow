import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(params: {
  name: string;
  email: string;
  tempPassword: string;
  role: Role;
  department?: string;
}) {
  const hashed = await bcrypt.hash(params.tempPassword, 10);
  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {},
    create: {
      name: params.name,
      email: params.email,
      password: hashed,
      role: params.role,
      department: params.department,
      mustChangePassword: true, // forces the password-change flow on first login
    },
  });
  console.log(`✓ ${params.role} -- ${user.email} (temp password: ${params.tempPassword})`);
}

async function main() {
  // Edit these before running -- especially the admin email/password.
  await upsertUser({
    name: "System Administrator",
    email: "admin@yourdomain.com",
    tempPassword: "ChangeMe123!",
    role: Role.ADMIN,
  });

  await upsertUser({
    name: "Advancement Office",
    email: "advancement@yourdomain.com",
    tempPassword: "ChangeMe123!",
    role: Role.ADVANCEMENT_OFFICE,
  });

  await upsertUser({
    name: "Senate Division",
    email: "senate@yourdomain.com",
    tempPassword: "ChangeMe123!",
    role: Role.SENATE_DIVISION,
  });

  await upsertUser({
    name: "University Council",
    email: "council@yourdomain.com",
    tempPassword: "ChangeMe123!",
    role: Role.COUNCIL,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });