import Prisma from "../src/db/db.js";
import Helper from "../src/utils/helper.js";

async function main() {
  console.log("🚀 Starting hierarchical seed (multi-level with rules)...");

  // ===== 1. Define role hierarchy =====
  const roles = [
    { name: "ADMIN", level: 0 },
    { name: "STATE HEAD", level: 1 },
    { name: "MASTER DISTRIBUTOR", level: 2 },
    { name: "DISTRIBUTOR", level: 3 },
    { name: "RETAILER", level: 4 },
  ];

  const createdRoles: Record<number, any> = {};

  for (const role of roles) {
    const created = await Prisma.role.upsert({
      where: { level: role.level },
      update: {},
      create: {
        name: role.name,
        level: role.level,
        description: `${role.name} role`,
      },
    });
    createdRoles[role.level] = created;
    console.log(`✅ Role created: ${created.name}`);
  }

  // ===== 2. Create Admins =====
  const adminData = [
    { username: "admin1", email: "admin1@gmail.com", phone: "9999999991" },
    { username: "admin2", email: "admin2@gmail.com", phone: "9999999992" },
  ];

  const admins: any[] = [];

  for (const data of adminData) {
    const hashedPassword = await Helper.hashPassword("Admin@123");
    const hashedPin = await Helper.hashPassword("1234");

    const admin = await Prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        username: data.username,
        firstName: data.username,
        lastName: "User",
        email: data.email,
        phoneNumber: data.phone,
        password: hashedPassword,
        transactionPin: hashedPin,
        roleId: createdRoles[0].id,
        hierarchyLevel: 0,
        hierarchyPath: "0",
        status: "ACTIVE",
        isKycVerified: true,
        profileImage: "https://via.placeholder.com/150",
      },
    });

    admins.push(admin);
    console.log(`👑 Created Admin: ${data.username}`);
  }

  // ===== 3. Helper for unique phone numbers =====
  let phoneCounter = 1000000;
  const nextPhone = () => `9${phoneCounter++}`;

  // ===== 4. Helper to create users under a parent =====
  async function createChildUsers(
    parentUser: any,
    childRole: any,
    count: number
  ) {
    const users: any[] = [];

    for (let i = 0; i < count; i++) {
      const email = `${childRole.name
        .replace(/\s+/g, "_")
        .toLowerCase()}_${parentUser.username}_${i + 1}@gmail.com`;
      const username = `${childRole.name
        .replace(/\s+/g, "_")
        .toLowerCase()}_${parentUser.username}_${i + 1}`;

      const hashedPassword = await Helper.hashPassword("User@123");
      const hashedPin = await Helper.hashPassword("1234");

      const user = await Prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          username,
          firstName: childRole.name.split(" ")[0],
          lastName: `${i + 1}`,
          email,
          phoneNumber: nextPhone(),
          password: hashedPassword,
          transactionPin: hashedPin,
          roleId: childRole.id,
          hierarchyLevel: childRole.level,
          hierarchyPath: `${parentUser.hierarchyPath}/${childRole.level}`,
          parentId: parentUser.id,
          status: "ACTIVE",
          isKycVerified: true,
          profileImage: "",
        },
      });

      users.push(user);
      console.log(
        `👤 Created ${childRole.name} (${username}) → Parent: ${parentUser.username}`
      );
    }

    return users;
  }

  // ===== 5. Build hierarchy according to rules =====
  const allUsersByLevel: Record<number, any[]> = { 0: admins };

  // Each user can create all roles below its own level
  for (const parentLevel of [0, 1, 2, 3]) {
    const parents = allUsersByLevel[parentLevel] || [];
    if (!parents.length) continue;

    for (const parent of parents) {
      for (let childLevel = parentLevel + 1; childLevel <= 4; childLevel++) {
        const childRole = createdRoles[childLevel];
        if (!childRole) continue;

        const children = await createChildUsers(parent, childRole, 2);
        if (!allUsersByLevel[childLevel]) allUsersByLevel[childLevel] = [];
        allUsersByLevel[childLevel]!.push(...children);
      }
    }
  }

  console.log("🎉 Hierarchical seeding completed successfully!");
}

main()
  .then(() => {
    console.log("✅ Seeding done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  });
