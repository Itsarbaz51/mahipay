import Prisma from "../src/db/db.js";
import Helper from "../src/utils/helper.js";

async function main() {
  // ===== 1. Create Admin Role =====
  const superAdminRole = await Prisma.role.upsert({
    where: { level: 0 }, // assume level 0 = SUPER_ADMIN
    update: {},
    create: {
      name: "ADMIN",
      level: 0,
      description: "Admin with all permissions",
    },
  });

  console.log("Admin Role created:", superAdminRole.id);

  // ===== 2. Create default Admin User =====
  const email = "admin@example.com";
  const password = "Admin@123"; // change before prod

  const hashedPassword = await Helper.hashPassword(password);
  const hashedPin = await Helper.hashPassword("1234");

  const superAdminUser = await Prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      username: "superadmin",
      firstName: "Super",
      lastName: "Admin",
      email,
      phoneNumber: "9999999999",
      password: hashedPassword,
      transactionPin: hashedPin,
      roleId: superAdminRole.id,
      isAuthorized: true,
      hierarchyLevel: 0,
      hierarchyPath: "0",
      status: "ACTIVE",
      isKycVerified: true,
      profileImage: "https://via.placeholder.com/150", // ✅ required
    },
  });

  console.log("Admin User created:", superAdminUser.id);

  // ===== 3. Assign all services to Admin Role =====
  const services = await Prisma.service.findMany();

  if (services.length > 0) {
    const rolePermissionsData = services.map((s) => ({
      roleId: superAdminRole.id,
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
}

main()
  .then(() => {
    console.log("Seeding completed ✅");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
