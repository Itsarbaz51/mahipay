import Prisma from "../src/db/db.js";
import Helper from "../src/utils/helper.js";

async function main() {
  const roleId = "dbaa628a-3e5d-4aa7-a306-a6b1939e654a";
  const parentId = "dbaa628a-3e5d-4aa7-a306-a6b1939e654a";

  // ===== 1️⃣ Ensure the role exists =====
  let role = await Prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    role = await Prisma.role.create({
      data: {
        id: roleId,
        name: "AGENT",
        level: 1,
        description: "Default Agent role for seeded users",
      },
    });
    console.log("✅ Created missing role:", role.id);
  } else {
    console.log("ℹ️ Role already exists:", role.id);
  }

  // ===== 2️⃣ Ensure parent user exists =====
  let parentUser = await Prisma.user.findUnique({ where: { id: parentId } });
  if (!parentUser) {
    const hashedPassword = await Helper.hashPassword("Parent@123");
    const hashedPin = await Helper.hashPassword("1234");

    parentUser = await Prisma.user.create({
      data: {
        id: parentId,
        username: "parentUser",
        firstName: "Parent",
        lastName: "User",
        email: "parent@example.com",
        phoneNumber: "9000000000",
        password: hashedPassword,
        transactionPin: hashedPin,
        roleId: role.id,
        isAuthorized: true,
        hierarchyLevel: 0,
        hierarchyPath: "0",
        status: "ACTIVE",
        isKycVerified: true,
        profileImage: "https://via.placeholder.com/150",
      },
    });

    console.log("✅ Created parent user:", parentUser.id);
  } else {
    console.log("ℹ️ Parent user already exists:", parentUser.id);
  }

  // ===== 3️⃣ Generate 20 Users =====
  for (let i = 1; i <= 20; i++) {
    const email = `user${i}@example.com`;
    const password = `User${i}@123`;

    const hashedPassword = await Helper.hashPassword(password);
    const hashedPin = await Helper.hashPassword("1234");

    const user = await Prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        username: `user${i}`,
        firstName: `User${i}`,
        lastName: "Test",
        email,
        phoneNumber: `99999999${i.toString().padStart(2, "0")}`,
        password: hashedPassword,
        transactionPin: hashedPin,
        roleId: role.id,
        parentId: parentUser.id,
        isAuthorized: true,
        hierarchyLevel: 1,
        hierarchyPath: `0/${i}`,
        status: "ACTIVE",
        isKycVerified: true,
        profileImage: "https://via.placeholder.com/150",
      },
    });

    console.log(`✅ Created User ${i}:`, user.email);
  }

  console.log("🎉 All 20 users created successfully!");
}

main()
  .then(() => {
    console.log("Seeding completed ✅");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error seeding users:", err);
    process.exit(1);
  });
