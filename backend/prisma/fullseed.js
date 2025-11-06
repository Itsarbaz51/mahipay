import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting hierarchical seed with states and cities...");

  const statesData = [
    {
      stateName: "Maharashtra",
      stateCode: "27",
      cities: [
        "Mumbai",
        "Pune",
        "Nagpur",
        "Thane",
        "Nashik",
        "Aurangabad",
        "Solapur",
        "Kolhapur",
        "Amravati",
      ],
    },
    {
      stateName: "Delhi",
      stateCode: "07",
      cities: [
        "New Delhi",
        "Central Delhi",
        "North Delhi",
        "South Delhi",
        "East Delhi",
        "West Delhi",
        "North East Delhi",
        "South West Delhi",
      ],
    },
    {
      stateName: "Karnataka",
      stateCode: "29",
      cities: [
        "Bangalore",
        "Mysore",
        "Hubli",
        "Belgaum",
        "Mangalore",
        "Gulbarga",
        "Davanagere",
        "Shimoga",
        "Bijapur",
      ],
    },
  ];

  const createdStates = {};
  const createdCities = {};

  console.log("🗺️ Creating states and cities...");

  for (const stateData of statesData) {
    try {
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

      console.log(`✅ State created: ${state.stateName} (${state.stateCode})`);

      for (const cityName of stateData.cities) {
        try {
          const cityCode = cityName.toUpperCase().replace(/\s+/g, "_");
          const city = await prisma.city.upsert({
            where: { cityCode },
            update: {},
            create: {
              cityName: cityName,
              cityCode: cityCode,
            },
          });
          createdCities[state.id].push(city);
          console.log(`   🏙️ City created: ${city.cityName}`);
        } catch (err) {
          console.log(
            `   ⚠️ City ${cityName} already exists or error: ${err.message}`
          );
        }
      }
    } catch (err) {
      console.log(
        `⚠️ State ${stateData.stateName} already exists or error: ${err.message}`
      );
    }
  }

  console.log("\n👥 Creating roles first...");

  const roles = [
    { name: "ADMIN", level: 0, description: "System Administrator" },
    { name: "STATE HEAD", level: 1, description: "State Head" },
    { name: "MASTER DISTRIBUTOR", level: 2, description: "Master Distributor" },
    { name: "DISTRIBUTOR", level: 3, description: "Distributor" },
    { name: "RETAILER", level: 4, description: "Retailer" },
  ];

  const createdRoles = {};

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
      profileImage: "",
      email: "admin1@gmail.com",
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

  console.log(`✅ Created Admin: ${admin.username}`);

  console.log("\n🔄 Updating roles with createdBy...");
  for (const role of Object.values(createdRoles)) {
    await prisma.role.update({
      where: { id: role.id },
      data: { createdBy: admin.id },
    });
  }

  const admins = [admin];

  let phoneCounter = 1000000;
  const nextPhone = () => `9${phoneCounter++}`;

  async function createSampleAddress(user) {
    try {
      const allStates = await prisma.state.findMany();
      const allCities = await prisma.city.findMany();

      if (!allStates.length || !allCities.length) {
        console.log(`   ⚠️ No states or cities available for address creation`);
        return;
      }

      const state = allStates[Math.floor(Math.random() * allStates.length)];
      const city = allCities[Math.floor(Math.random() * allCities.length)];

      if (!state || !city) {
        console.log(
          `   ⚠️ Invalid state or city selected for address creation`
        );
        return;
      }

      const address = await prisma.address.create({
        data: {
          address: `${Math.floor(Math.random() * 100) + 1} ${city.cityName} Street, ${state.stateName}`,
          pinCode: `${Math.floor(Math.random() * 900000) + 100000}`,
          stateId: state.id,
          cityId: city.id,
        },
      });

      console.log(
        `   📍 Created address for ${user.username} in ${city.cityName}, ${state.stateName}`
      );
      return address;
    } catch (error) {
      console.log(
        `   ⚠️ Failed to create address for ${user.username}: ${error.message}`
      );
    }
  }

  async function createChildUsers(parent, role, count) {
    const users = [];

    for (let i = 0; i < count; i++) {
      const username = `${role.name.toLowerCase()}_${parent.username}_${i + 1}`;
      const email = `${username}@gmail.com`;
      const password = hashSync("User@123", 10);
      const pin = hashSync("1234", 10);

      if (!parent) {
        console.log(`⚠️ Parent is undefined for creating child user`);
        continue;
      }

      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          username,
          firstName: role.name.split("_")[0],
          lastName: `${i + 1}`,
          profileImage: "https://via.placeholder.com/150",
          email,
          phoneNumber: nextPhone(),
          password,
          transactionPin: pin,
          roleId: role.id,
          hierarchyLevel: role.level,
          hierarchyPath: `${parent.hierarchyPath}/${role.level}`,
          parentId: parent.id,
          status: "ACTIVE",
          isKycVerified: true,
        },
      });

      users.push(user);
      console.log(
        `👤 Created ${role.name}: ${username} → Parent: ${parent.username}`
      );
      await createSampleAddress(user);
    }

    return users;
  }

  console.log("\n🏗️ Building user hierarchy...");

  const allUsersByLevel = { 0: admins };

  for (const level of [0, 1, 2, 3]) {
    const parents = allUsersByLevel[level] || [];
    for (const parent of parents) {
      const nextLevel = level + 1;
      if (nextLevel <= 4) {
        const role = createdRoles[nextLevel];
        if (!role) {
          console.log(`⚠️ Role for level ${nextLevel} not found`);
          continue;
        }
        const children = await createChildUsers(parent, role, 2);
        if (!allUsersByLevel[nextLevel]) allUsersByLevel[nextLevel] = [];
        allUsersByLevel[nextLevel].push(...children);
      }
    }
  }

  console.log("\n💰 Creating wallets...");

  const allUsers = Object.values(allUsersByLevel).flat();
  for (const user of allUsers) {
    await prisma.wallet.upsert({
      where: {
        userId_walletType: { userId: user.id, walletType: "PRIMARY" },
      },
      update: {},
      create: {
        userId: user.id,
        walletType: "PRIMARY",
        balance: BigInt(1000000),
        availableBalance: BigInt(1000000),
        holdBalance: BigInt(0),
        currency: "INR",
        isActive: true,
      },
    });
    console.log(`   💳 Wallet created for ${user.username}`);
  }

  console.log("\n🏢 Creating service providers...");

  const serviceProviders = [
    { type: "AEPS", code: "AEPS_BULKPE", name: "BulkPE AEPS" },
    { type: "BBPS", code: "BBPS_PAYTM", name: "PayTM BBPS" },
    { type: "DMT", code: "DMT_YESBANK", name: "Yes Bank DMT" },
    { type: "RECHARGE", code: "RECH_AIRTEL", name: "Airtel Recharge" },
    { type: "CC_PAYOUT", code: "CC_RAZORPAY", name: "Razorpay Payout" },
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

  console.log("\n⚙️ Creating system settings...");

  const existingSettings = await prisma.systemSetting.findFirst();

  if (!existingSettings) {
    const now = new Date();

    await prisma.systemSetting.create({
      data: {
        companyName: "Fintech Platform",
        companyLogo: "https://via.placeholder.com/150x50",
        favIcon: "https://via.placeholder.com/32x32",
        phoneNumber: "1800-123-4567",
        whtsappNumber: "919999999999",
        companyEmail: "support@fintech.com",
        facebookUrl: "https://facebook.com/fintech",
        instagramUrl: "https://instagram.com/fintech",
        twitterUrl: "https://twitter.com/fintech",
        linkedinUrl: "https://linkedin.com/company/fintech",
        websiteUrl: "https://fintech.com",
        settings: {
          maintenanceMode: false,
          currency: "INR",
          timezone: "Asia/Kolkata",
        },
        userId: admin.id,
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log(`✅ System settings created`);
  } else {
    console.log(`✅ System settings already exist`);
  }

  console.log("\n🏦 Creating bank details for users...");

  const banks = [
    { bankName: "State Bank of India", ifscCode: "SBIN0000001" },
    { bankName: "HDFC Bank", ifscCode: "HDFC0000001" },
    { bankName: "ICICI Bank", ifscCode: "ICIC0000001" },
    { bankName: "Axis Bank", ifscCode: "UTIB0000001" },
  ];

  const usersToAddBanks = allUsers.slice(0, 10);

  for (let i = 0; i < usersToAddBanks.length; i++) {
    const user = usersToAddBanks[i];
    const bank = banks[i % banks.length];

    if (!bank) continue;

    try {
      await prisma.bankDetail.create({
        data: {
          accountHolder: `${user.firstName} ${user.lastName}`,
          accountNumber: `123456789${i.toString().padStart(3, "0")}`,
          phoneNumber: user.phoneNumber,
          accountType: "PERSONAL",
          ifscCode: bank.ifscCode,
          bankName: bank.bankName,
          bankProofFile: "https://via.placeholder.com/150",
          isVerified: true,
          isPrimary: true,
          userId: user.id,
        },
      });
      console.log(`✅ Bank detail created for ${user.username}`);
    } catch (err) {
      console.log(
        `⚠️ Bank detail creation failed for ${user.username}: ${err.message}`
      );
    }
  }

  console.log("\n💰 Creating commission settings...");

  const commissionSettings = [
    {
      scope: "ROLE",
      roleId: createdRoles[4].id,
      commissionType: "PERCENTAGE",
      commissionValue: 1.5,
      minAmount: BigInt(1000),
      maxAmount: BigInt(100000),
      applyTDS: true,
      tdsPercent: 5.0,
      applyGST: true,
      gstPercent: 18.0,
    },
    {
      scope: "ROLE",
      roleId: createdRoles[3].id,
      commissionType: "PERCENTAGE",
      commissionValue: 1.0,
      minAmount: BigInt(5000),
      maxAmount: BigInt(500000),
      applyTDS: true,
      tdsPercent: 5.0,
      applyGST: true,
      gstPercent: 18.0,
    },
  ];

  for (const setting of commissionSettings) {
    await prisma.commissionSetting.create({
      data: {
        ...setting,
        createdBy: admin.id,
        isActive: true,
        effectiveFrom: new Date(),
      },
    });

    const roleEntries = Object.entries(createdRoles);
    const roleEntry = roleEntries.find(
      ([key, role]) => role.id === setting.roleId
    );
    const roleName = roleEntry ? roleEntry[1].name : "Unknown";

    console.log(`✅ Commission setting created for ${roleName}`);
  }

  console.log("\n🎉 Hierarchical seeding completed successfully!");
  console.log("📊 Summary:");
  console.log(`🗺️ States: ${Object.keys(createdStates).length}`);
  const totalCities = Object.values(createdCities).reduce(
    (t, c) => t + c.length,
    0
  );
  console.log(`🏙️ Cities: ${totalCities}`);
  console.log(`👥 Roles: ${Object.keys(createdRoles).length}`);
  console.log(`👤 Total Users: ${allUsers.length}`);
  console.log(`💰 Wallets: ${allUsers.length}`);
  console.log(`🏢 Service Providers: ${serviceProviders.length}`);
  console.log(`🏦 Bank Details: ${usersToAddBanks.length}`);
  console.log(`💰 Commission Settings: ${commissionSettings.length}`);

  console.log("\n🏷️ State Codes Created:");
  Object.values(createdStates).forEach((state) => {
    console.log(`   ${state.stateName}: ${state.stateCode}`);
  });
}

main()
  .then(async () => {
    console.log("✅ Seeding completed successfully!");
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Seeding failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });