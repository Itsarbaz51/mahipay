import Prisma from "../src/db/db.js";
import Helper from "../src/utils/helper.js";

async function main() {
  // ===== 1. Create Admin Role =====
  const adminRole = await Prisma.role.upsert({
    where: { level: 0 },
    update: {},
    create: {
      name: "ADMIN",
      level: 0,
      description: "Admin with all permissions",
    },
  });

  console.log("Admin Role created:", adminRole.id);

  // ===== 2. Create default Admin User =====
  const email = "admin@gmail.com";
  const password = "Admin@123";

  const hashedPassword = await Helper.hashPassword(password);
  const hashedPin = await Helper.hashPassword("1234");

  const adminUser = await Prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      email,
      phoneNumber: "9999999999",
      password: hashedPassword,
      transactionPin: hashedPin,
      roleId: adminRole.id,
      isAuthorized: true,
      hierarchyLevel: 0,
      hierarchyPath: "0",
      status: "ACTIVE",
      isKycVerified: true,
      profileImage: "https://via.placeholder.com/150",
    },
  });

  console.log("Admin User created:", adminUser.id);

  // ===== 3. Assign all services to Admin Role =====
  const services = await Prisma.serviceProvider.findMany();

  if (services.length > 0) {
    const rolePermissionsData = services.map((s: any) => ({
      roleId: adminRole.id,
      serviceId: s.id,
      canView: true,
      canEdit: true,
      canSetCommission: true,
    }));

    await Prisma.rolePermission.createMany({
      data: rolePermissionsData,
      skipDuplicates: true,
    });

    console.log("Assigned all services permissions to Admin role");
  }

  // ===== 4. Create Other Roles =====
  const roles = [
    { name: "STATE HEAD", level: 1 },
    { name: "MASTER DISTRIBUTOR", level: 2 },
    { name: "DISTRIBUTOR", level: 3 },
    { name: "RETAILER", level: 4 },
  ];

  const createdRoles: typeof roles & any = [];
  for (const role of roles) {
    const created = await Prisma.role.upsert({
      where: { level: role.level },
      update: {},
      create: {
        name: role.name,
        level: role.level,
        description: `${role.name.replace("_", " ")} role`,
      },
    });
    console.log(`Role created: ${created.name}`);
    createdRoles.push(created);
  }

  // ===== 5. Create 20 Users with hierarchy =====
  const allUsers: any[] = [
    { ...adminUser, hierarchyLevel: 0, hierarchyPath: "0" },
  ];

  for (let i = 1; i <= 20; i++) {
    const randomRole =
      createdRoles[Math.floor(Math.random() * createdRoles.length)];
    const userEmail = `user${i}@gmail.com`;
    const userPhone = `90000000${i.toString().padStart(2, "0")}`;
    const username = `user${i}`;
    const pwdHash = await Helper.hashPassword("User@123");
    const pinHash = await Helper.hashPassword("1234");

    // Determine parent
    const possibleParents = allUsers.filter(
      (u) => u.hierarchyLevel === randomRole.level - 1
    );

    let parentId: string | null = null;
    let hierarchyPath: string;

    if (possibleParents.length > 0) {
      const parent =
        possibleParents[Math.floor(Math.random() * possibleParents.length)];
      parentId = parent.id;
      hierarchyPath = `${parent.hierarchyPath}/${randomRole.level}`;
    } else {
      // no parent available (should not happen for level>0 if admin exists), default to adminUser
      parentId = adminUser.id;
      hierarchyPath = `0/${randomRole.level}`;
    }

    const user = await Prisma.user.create({
      data: {
        username,
        firstName: `First${i}`,
        lastName: `Last${i}`,
        email: userEmail,
        phoneNumber: userPhone,
        password: pwdHash,
        transactionPin: pinHash,
        roleId: randomRole.id,
        isAuthorized: true,
        hierarchyLevel: randomRole.level,
        hierarchyPath,
        parentId,
        status: "ACTIVE",
        isKycVerified: true,
        profileImage: "",
      },
    });

    console.log(
      `Created user ${username} with role ${randomRole.name} — parentId: ${parentId}`
    );

    allUsers.push({ ...user, hierarchyLevel: randomRole.level, hierarchyPath });
  }

  console.log("Seeding completed ✅");
  process.exit(0);
}

main()
  .then(() => {})
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
