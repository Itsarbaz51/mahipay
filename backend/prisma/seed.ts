// seed.ts
import Prisma from "../src/db/db.js";
import AddressServices from "../src/services/address.service.js";
import Helper from "../src/utils/helper.js";

async function main() {
  console.log("🚀 Starting hierarchical seed with states and cities...");

  const statesData = [
    {
      stateName: "Maharashtra",
      stateCode: "27",
      cities: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati"],
    },
    {
      stateName: "Delhi",
      stateCode: "07",
      cities: ["New Delhi", "Central Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "North East Delhi", "South West Delhi"],
    },
    {
      stateName: "Karnataka",
      stateCode: "29",
      cities: ["Bangalore", "Mysore", "Hubli", "Belgaum", "Mangalore", "Gulbarga", "Davanagere", "Shimoga", "Bijapur"],
    },
    {
      stateName: "Tamil Nadu",
      stateCode: "33",
      cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore", "Erode", "Thoothukudi"],
    },
    {
      stateName: "Uttar Pradesh",
      stateCode: "09",
      cities: ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Allahabad", "Ghaziabad", "Noida", "Bareilly"],
    },
    {
      stateName: "Gujarat",
      stateCode: "24",
      cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Anand"],
    },
    {
      stateName: "Rajasthan",
      stateCode: "08", // ✅ RAJASTHAN CODE 08
      cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Sikar"],
    },
    {
      stateName: "West Bengal",
      stateCode: "19",
      cities: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Malda", "Bardhaman", "Habra", "Kharagpur"],
    },
    {
      stateName: "Telangana",
      stateCode: "36",
      cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Adilabad", "Nalgonda"],
    },
    {
      stateName: "Kerala",
      stateCode: "32",
      cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur", "Kannur", "Alappuzha", "Kottayam", "Palakkad"],
    },
  ];

  const createdStates: Record<string, any> = {};
  const createdCities: Record<string, any[]> = {};

  console.log("🗺️ Creating states and cities...");

  for (const stateData of statesData) {
    try {
      const formattedName = stateData.stateName.charAt(0).toUpperCase() + stateData.stateName.slice(1).toLowerCase();
      
      const state = await Prisma.state.upsert({
        where: { stateCode: stateData.stateCode },
        update: {},
        create: {
          stateName: formattedName,
          stateCode: stateData.stateCode,
        },
      });
      
      createdStates[state.id] = state;
      createdCities[state.id] = [];

      console.log(`✅ State created: ${state.stateName} (${state.stateCode})`);

      for (const cityName of stateData.cities) {
        try {
          const city = await AddressServices.storeCity({ cityName });
          createdCities[state.id]!.push(city);
          console.log(`   🏙️ City created: ${city.cityName}`);
        } catch (err: any) {
          console.log(`   ⚠️ City ${cityName} already exists or error: ${err.message}`);
        }
      }
    } catch (err: any) {
      console.log(`⚠️ State ${stateData.stateName} already exists or error: ${err.message}`);
    }
  }

  // ===== 2. Create Roles =====
  console.log("\n👥 Creating roles...");

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

  // ===== 3. Create Admin Users =====
  console.log("\n👑 Creating admin users...");

  const adminData = [
    { username: "admin1", email: "admin1@gmail.com", phone: "9999999991" },
    { username: "admin2", email: "admin2@gmail.com", phone: "9999999992" },
  ];

  const admins: any[] = [];

  for (const data of adminData) {
    const password = await Helper.hashPassword("Admin@123");
    const pin = await Helper.hashPassword("1234");

    const admin = await Prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        username: data.username,
        firstName: data.username,
        lastName: "User",
        email: data.email,
        phoneNumber: data.phone,
        password,
        transactionPin: pin,
        roleId: createdRoles[0].id,
        hierarchyLevel: 0,
        hierarchyPath: "0",
        status: "ACTIVE",
        isKycVerified: true,
        profileImage: "https://via.placeholder.com/150",
      },
    });

    admins.push(admin);
    console.log(`✅ Created Admin: ${admin.username}`);
  }

  // ===== 4. Helpers =====
  let phoneCounter = 1000000;
  const nextPhone = () => `9${phoneCounter++}`;

  async function createSampleAddress(user: any) {
    try {
      const allStates = await AddressServices.indexState();
      const allCities = await AddressServices.indexCity();

      if (!allStates.length || !allCities.length) {
        console.log(`   ⚠️ No states or cities available for address creation`);
        return;
      }

      const state = allStates[Math.floor(Math.random() * allStates.length)];
      const city = allCities[Math.floor(Math.random() * allCities.length)];

      if (!state || !city) {
        console.log(`   ⚠️ Invalid state or city selected for address creation`);
        return;
      }

      const addressData = {
        address: `${Math.floor(Math.random() * 100) + 1} ${city.cityName} Street, ${state.stateName}`,
        pinCode: `${Math.floor(Math.random() * 900000) + 100000}`,
        stateId: state.id,
        cityId: city.id,
      };

      const address = await AddressServices.storeUserAddress(addressData);
      console.log(`   📍 Created address for ${user.username} in ${city.cityName}, ${state.stateName}`);
      return address;
    } catch (error: any) {
      console.log(`   ⚠️ Failed to create address for ${user.username}: ${error.message}`);
    }
  }

  async function createChildUsers(parent: any, role: any, count: number) {
    const users: any[] = [];

    for (let i = 0; i < count; i++) {
      const username = `${role.name.replace(/\s+/g, "_").toLowerCase()}_${parent.username}_${i + 1}`;
      const email = `${username}@gmail.com`;
      const password = await Helper.hashPassword("User@123");
      const pin = await Helper.hashPassword("1234");

      if (!parent) {
        console.log(`⚠️ Parent is undefined for creating child user`);
        continue;
      }

      const user = await Prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          username,
          firstName: role.name.split(" ")[0],
          lastName: `${i + 1}`,
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
          profileImage: "https://via.placeholder.com/150",
        },
      });

      users.push(user);
      console.log(`👤 Created ${role.name}: ${username} → Parent: ${parent.username}`);
      await createSampleAddress(user);
    }

    return users;
  }

  // ===== 5. Build Hierarchy =====
  console.log("\n🏗️ Building user hierarchy...");

  const allUsersByLevel: Record<number, any[]> = { 0: admins };

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

  // ===== 6. Wallets =====
  console.log("\n💰 Creating wallets...");

  const allUsers = Object.values(allUsersByLevel).flat();
  for (const user of allUsers) {
    await Prisma.wallet.upsert({
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

  // ===== 7. Service Providers =====
  console.log("\n🏢 Creating service providers...");

  const serviceProviders = [
    { type: "AEPS", code: "AEPS_BULKPE", name: "BulkPE AEPS" },
    { type: "BBPS", code: "BBPS_PAYTM", name: "PayTM BBPS" },
    { type: "DMT", code: "DMT_YESBANK", name: "Yes Bank DMT" },
    { type: "RECHARGE", code: "RECH_AIRTEL", name: "Airtel Recharge" },
    { type: "CC_PAYOUT", code: "CC_RAZORPAY", name: "Razorpay Payout" },
  ];

  for (const provider of serviceProviders) {
    await Prisma.serviceProvider.upsert({
      where: { code: provider.code },
      update: {},
      create: {
        type: provider.type,
        code: provider.code,
        name: provider.name,
        isActive: true,
        createdBy: admins[0].id,
        config: {
          apiKey: "demo_key",
          baseUrl: "https://api.demo.com/v1",
          timeout: 30000,
        },
      },
    });
    console.log(`✅ Service provider created: ${provider.name}`);
  }

  console.log("\n🎉 Hierarchical seeding completed successfully!");
  console.log("📊 Summary:");
  console.log(`🗺️ States: ${Object.keys(createdStates).length}`);
  const totalCities = Object.values(createdCities).reduce((t, c) => t + c.length, 0);
  console.log(`🏙️ Cities: ${totalCities}`);
  console.log(`👥 Roles: ${Object.keys(createdRoles).length}`);
  console.log(`👤 Total Users: ${allUsers.length}`);
  console.log(`💰 Wallets: ${allUsers.length}`);
  console.log(`🏢 Service Providers: ${serviceProviders.length}`);
  
  console.log("\n🏷️ State Codes Created:");
  Object.values(createdStates).forEach(state => {
    console.log(`   ${state.stateName}: ${state.stateCode}`);
  });
}

main()
  .then(async () => {
    console.log("✅ Seeding completed successfully!");
    await Prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Seeding failed:", err);
    await Prisma.$disconnect();
    process.exit(1);
  });