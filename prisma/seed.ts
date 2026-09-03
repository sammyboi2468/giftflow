import { PrismaClient, Role, RequestStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding pre-provisioned user accounts...");
  const tempPassword = await bcrypt.hash("TempPass123!", 10);

  // 1. Seed Applicant User
  const applicant = await prisma.user.upsert({
    where: { email: "jenkins.cs@university.edu" },
    update: { password: tempPassword, mustChangePassword: true },
    create: {
      name: "Dr. Sarah Jenkins",
      email: "jenkins.cs@university.edu",
      password: tempPassword,
      mustChangePassword: true,
      role: Role.DEPARTMENT_USER,
      department: "Computer Science",
    },
  });

  // 2. Seed Advancement Reviewer User
  await prisma.user.upsert({
    where: { email: "advancement@university.edu" },
    update: { password: tempPassword, mustChangePassword: true },
    create: {
      name: "Prof. Arthur Pendelton",
      email: "advancement@university.edu",
      password: tempPassword,
      mustChangePassword: true,
      role: Role.ADVANCEMENT_OFFICE,
      department: "Advancement Office",
    },
  });

  await prisma.user.upsert({
    where: { email: "senate@university.edu" },
    update: { password: tempPassword, mustChangePassword: true },
    create: {
      name: "Prof. Damilola Samson",
      email: "senate@university.edu",
      password: tempPassword,
      mustChangePassword: true,
      role: Role.SENATE_DIVISION,
      department: "Senate division",
    },
  });

  await prisma.user.upsert({
    where: { email: "council@university.edu" },
    update: { password: tempPassword, mustChangePassword: true },
    create: {
      name: "Prof. Joshua Salami",
      email: "council@university.edu",
      password: tempPassword,
      mustChangePassword: true,
      role: Role.COUNCIL,
      department: "Council",
    },
  });

  console.log("Database seeded successfully!");
  console.log("Temporary password for accounts: TempPass123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });