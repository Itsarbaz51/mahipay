// seed.ts
import { PrismaClient, Prisma } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting minimal seed...");

  // ===== 1. Create States and Cities (Optional but useful) =====
  const statesData = [
    {
      stateName: "Maharashtra",
      stateCode: "27",
      cities: ["Mumbai", "Pune"],
    },
  ];

  const createdStates: Record<string, any> = {};
  const createdCities: Record<string, any[]> = {};

  for (const stateData of statesData) {
    const state = await prisma.state.upsert({
      where: { stateCode: stateData.stateCode },
      update: {},
      create: {
        stateName: stateData.stateName,
        stateCode: stateData.stateCode,
      },
    });
    createdStates[state.id] = state;
    createdCities[state.id] = [];

    for (const cityName of stateData.cities) {
      const cityCode = cityName.toUpperCase().replace(/\s+/g, "_");
      const city = await prisma.city.upsert({
        where: { cityCode },
        update: {},
        create: {
          cityName,
          cityCode,
        },
      });
      createdCities[state.id]!.push(city);
    }
  }

  // ===== 2. Create Roles =====
  console.log("\n👥 Creating roles...");

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
      },
    });
    createdRoles[role.level] = created;
    console.log(`✅ Role created: ${created.name}`);
  }

  // ===== 3. Create Admin User =====
  console.log("\n👑 Creating Admin user...");

  const adminPassword = hashSync("Admin@123", 10);
  const adminPin = hashSync("1234", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      profileImage: "https://via.placeholder.com/150",
      email: "admin@gmail.com",
      phoneNumber: "9999999991",
      password: adminPassword,
      transactionPin: adminPin,
      roleId: createdRoles[0].id,
      hierarchyLevel: 0,
      hierarchyPath: "0",
      status: "ACTIVE",
      isKycVerified: true,
    },
  });

  console.log(`✅ Admin created: ${admin.username}`);

  // ===== 4. Create One State Head User =====
  console.log("\n👤 Creating State Head user...");

  const shPassword = hashSync("User@123", 10);
  const shPin = hashSync("1234", 10);

  const stateHead = await prisma.user.upsert({
    where: { email: "statehead@gmail.com" },
    update: {},
    create: {
      username: "state_head_1",
      firstName: "State",
      lastName: "Head",
      profileImage: "https://via.placeholder.com/150",
      email: "statehead@gmail.com",
      phoneNumber: "9999999992",
      password: shPassword,
      transactionPin: shPin,
      roleId: createdRoles[1].id,
      hierarchyLevel: 1,
      hierarchyPath: "0/1",
      parentId: admin.id,
      status: "ACTIVE",
      isKycVerified: true,
    },
  });

  console.log(`✅ State Head created: ${stateHead.username}`);

  // ===== 5. Create Wallets =====
  console.log("\n💰 Creating wallets...");

  const users = [admin, stateHead];
  for (const user of users) {
    await prisma.wallet.upsert({
      where: {
        userId_walletType: { userId: user.id, walletType: "PRIMARY" },
      },
      update: {},
      create: {
        userId: user.id,
        walletType: "PRIMARY",
        balance: BigInt(100000),
        availableBalance: BigInt(100000),
        holdBalance: BigInt(0),
        currency: "INR",
        isActive: true,
      },
    });
    console.log(`💳 Wallet created for ${user.username}`);
  }

  // ===== 6. Create Two Service Providers =====
  console.log("\n🏢 Creating service providers...");

  const serviceProviders = [
    { type: "AEPS", code: "AEPS_BULKPE", name: "BulkPE AEPS" },
    { type: "BBPS", code: "BBPS_PAYTM", name: "PayTM BBPS" },
  ];

  for (const provider of serviceProviders) {
    await prisma.serviceProvider.upsert({
      where: { code: provider.code },
      update: {},
      create: {
        type: provider.type,
        code: provider.code,
        name: provider.name,
        isActive: true,
        createdBy: admin.id,
        config: {
          apiKey: "demo_key",
          baseUrl: "https://api.demo.com/v1",
          timeout: 30000,
        },
      },
    });
    console.log(`✅ Service provider created: ${provider.name}`);
  }

  console.log("\n🎉 Seeding completed successfully!");
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
