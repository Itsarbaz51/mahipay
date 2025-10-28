// seed-admin.ts
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Seeding admin and all roles...");

  // ===== 1. Create Roles =====
  const roles = [
    { name: "ADMIN", level: 0, description: "System Administrator" },
    { name: "STATE HEAD", level: 1, description: "State Head" },
    { name: "MASTER DISTRIBUTOR", level: 2, description: "Master Distributor" },
    { name: "DISTRIBUTOR", level: 3, description: "Distributor" },
    { name: "RETAILER", level: 4, description: "Retailer" },
  ];

  const createdRoles: Record<number, any> = {};

  for (const role of roles) {
    const created = await prisma.role.upsert({
      where: { level: role.level },
      update: {},
      create: {
        name: role.name,
        level: role.level,
        description: role.description,
        createdBy: null,
      },
    });
    createdRoles[role.level] = created;
    console.log(`✅ Role created: ${created.name}`);
  }

  // ===== 2. Create Admin User =====
  console.log("\n👑 Creating admin user...");

  const adminPassword = hashSync("Admin@123", 10);
  const adminPin = hashSync("1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin1@gmail.com" },
    update: {},
    create: {
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      profileImage: "https://via.placeholder.com/150",
      email: "admin1@gmail.com",
      phoneNumber: "9999999991",
      password: adminPassword,
      transactionPin: adminPin,
      roleId: createdRoles[0].id, // ADMIN role
      hierarchyLevel: 0,
      hierarchyPath: "0",
      status: "ACTIVE",
      isKycVerified: true,
    },
  });

  console.log(`✅ Admin user created: ${admin.username}`);

  // ===== 3. Update Roles createdBy =====
  console.log("\n🔄 Updating roles with createdBy...");
  for (const role of Object.values(createdRoles)) {
    await prisma.role.update({
      where: { id: role.id },
      data: { createdBy: admin.id },
    });
  }

  console.log("\n🎉 Seeding completed successfully!");
  console.log(`👑 Admin: ${admin.email}`);
  console.log(`👥 Roles created: ${roles.length}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Seeding failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
