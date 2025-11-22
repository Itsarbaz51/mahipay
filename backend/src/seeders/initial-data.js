import { CryptoService } from "../utils/cryptoService.js";

export default {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = await import("uuid");

    // Generate UUIDs upfront for consistent references
    const rootUserId = uuidv4();
    const adminUserId = uuidv4();

    // Create UUIDs for roles
    const rootRoleId = uuidv4();
    const adminRoleId = uuidv4();
    const stateHeadRoleId = uuidv4();
    const masterDistributorRoleId = uuidv4();
    const distributorRoleId = uuidv4();
    const retailerRoleId = uuidv4();

    // Create UUIDs for other entities
    const maharashtraStateId = uuidv4();
    const mumbaiCityId = uuidv4();
    const puneCityId = uuidv4();
    const rootWalletId = uuidv4();
    const adminWalletId = uuidv4();
    const rootPrimaryWalletId = uuidv4();
    const razorpayProviderId = uuidv4();
    const paytmBbpsProviderId = uuidv4();

    // First create the Root user since roles need created_by_id
    const rootPassword = CryptoService.encrypt("Root@123");

    // Create Root user first
    await queryInterface.bulkInsert("roots", [
      {
        id: rootUserId,
        username: "root",
        first_name: "Super",
        last_name: "Admin",
        profile_image: null,
        email: "root@system.com",
        phone_number: "9999999990",
        password: rootPassword,
        status: "ACTIVE",
        hierarchy_level: 0,
        hierarchy_path: "0",
        refresh_token: null,
        password_reset_token: null,
        password_reset_expires: null,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);

    // Insert initial roles with proper created_by_id reference
    await queryInterface.bulkInsert("roles", [
      {
        id: rootRoleId,
        name: "ROOT",
        hierarchy_level: 0,
        description: "Root Administrator - Full System Access",
        created_by_type: "ROOT",
        created_by_id: rootUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: adminRoleId,
        name: "ADMIN",
        hierarchy_level: 1,
        description: "System Administrator",
        created_by_type: "ROOT",
        created_by_id: rootUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: stateHeadRoleId,
        name: "STATE_HEAD",
        hierarchy_level: 2,
        description: "State Head",
        created_by_type: "ROOT",
        created_by_id: rootUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: masterDistributorRoleId,
        name: "MASTER_DISTRIBUTOR",
        hierarchy_level: 3,
        description: "Master Distributor",
        created_by_type: "ROOT",
        created_by_id: rootUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: distributorRoleId,
        name: "DISTRIBUTOR",
        hierarchy_level: 4,
        description: "Distributor",
        created_by_type: "ROOT",
        created_by_id: rootUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: retailerRoleId,
        name: "RETAILER",
        hierarchy_level: 5,
        description: "Retailer",
        created_by_type: "ROOT",
        created_by_id: rootUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Insert states
    await queryInterface.bulkInsert("states", [
      {
        id: maharashtraStateId,
        state_name: "Maharashtra",
        state_code: "MH",
        country_code: "IN",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Insert cities
    await queryInterface.bulkInsert("cities", [
      {
        id: mumbaiCityId,
        state_id: maharashtraStateId,
        city_name: "Mumbai",
        city_code: "MUM",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: puneCityId,
        state_id: maharashtraStateId,
        city_name: "Pune",
        city_code: "PUN",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Create Admin user
    const adminPassword = CryptoService.encrypt("Admin@123");
    const adminPin = CryptoService.encrypt("1234");

    // Generate customer ID (8 digits)
    const adminCustomerId = String(
      Math.floor(10000000 + Math.random() * 90000000)
    );

    await queryInterface.bulkInsert("users", [
      {
        id: adminUserId,
        customer_id: adminCustomerId,
        username: "admin",
        first_name: "System",
        last_name: "Administrator",
        profile_image: null,
        email: "admin@system.com",
        phone_number: "9999999991",
        password: adminPassword,
        transaction_pin: adminPin,
        role_id: adminRoleId,
        parent_id: rootUserId,
        hierarchy_level: 1,
        hierarchy_path: `1.${rootUserId}`,
        status: "ACTIVE",
        is_kyc_verified: true,
        refresh_token: null,
        password_reset_token: null,
        password_reset_expires: null,
        email_verification_token: null,
        email_verified_at: new Date(),
        email_verification_token_expires: null,
        last_login_at: null,
        deactivation_reason: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);

    // Create wallets for users
    await queryInterface.bulkInsert("wallets", [
      {
        id: rootWalletId,
        user_id: rootUserId,
        wallet_type: "PRIMARY",
        balance: 100000.0,
        available_balance: 100000.0,
        hold_balance: 0.0,
        currency: "INR",
        is_active: true,
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: adminWalletId,
        user_id: adminUserId,
        wallet_type: "PRIMARY",
        balance: 50000.0,
        available_balance: 50000.0,
        hold_balance: 0.0,
        currency: "INR",
        is_active: true,
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Create Root wallet
    await queryInterface.bulkInsert("root_wallets", [
      {
        id: rootPrimaryWalletId,
        root_id: rootUserId,
        wallet_type: "PRIMARY",
        balance: 1000000.0,
        available_balance: 1000000.0,
        hold_balance: 0.0,
        currency: "INR",
        is_active: true,
        version: 1,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Create service providers
    await queryInterface.bulkInsert("service_providers", [
      {
        id: razorpayProviderId,
        name: "Razorpay",
        code: "RAZORPAY",
        service_type: "PAYMENT_GATEWAY",
        description: "Razorpay Payment Gateway Integration",
        config: JSON.stringify({
          key_id: "rzp_test_XXXXXXXXXXXX",
          key_secret: "XXXXXXXXXXXXXXXXXXXXXXXX",
          webhook_secret: "XXXXXXXXXXXXXXXX",
        }),
        is_active: true,
        api_integration_status: true,
        hierarchy_level: 1,
        hierarchy_path: "payment.razorpay",
        created_by_root_id: rootUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: paytmBbpsProviderId,
        name: "PayTM BBPS",
        code: "BBPS_PAYTM",
        service_type: "BBPS",
        description: "PayTM BBPS Bill Payments Integration",
        config: JSON.stringify({
          merchant_id: "PAYTMXXXX",
          merchant_key: "XXXXXXXXXXXXXXXX",
          base_url: "https://bbps-api.paytm.com",
        }),
        is_active: true,
        api_integration_status: true,
        hierarchy_level: 1,
        hierarchy_path: "bbps.paytm",
        created_by_root_id: rootUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Insert some essential system settings
    await queryInterface.bulkInsert("system_settings", [
      {
        id: uuidv4(),
        root_id: rootUserId,
        setting_key: "SYSTEM_MAINTENANCE_MODE",
        setting_value: "false",
        data_type: "BOOLEAN",
        description: "System maintenance mode",
        is_public: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        root_id: rootUserId,
        setting_key: "DEFAULT_COMMISSION_RATE",
        setting_value: "2.5",
        data_type: "DECIMAL",
        description: "Default commission rate in percentage",
        is_public: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        root_id: rootUserId,
        setting_key: "MINIMUM_TRANSACTION_AMOUNT",
        setting_value: "10.00",
        data_type: "DECIMAL",
        description: "Minimum transaction amount",
        is_public: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log("✅ Database seeded successfully!");
    console.log("📋 Default credentials:");
    console.log("   Root User: root@system.com / Root@123");
    console.log("   Admin User: admin@system.com / Admin@123");
  },

  async down(queryInterface, Sequelize) {
    // Remove all seeded data in correct order to handle foreign key constraints
    await queryInterface.bulkDelete("system_settings", null, {});
    await queryInterface.bulkDelete("service_providers", null, {});
    await queryInterface.bulkDelete("root_wallets", null, {});
    await queryInterface.bulkDelete("wallets", null, {});
    await queryInterface.bulkDelete("users", null, {});
    await queryInterface.bulkDelete("roots", null, {});
    await queryInterface.bulkDelete("cities", null, {});
    await queryInterface.bulkDelete("states", null, {});
    await queryInterface.bulkDelete("roles", null, {});

    console.log("🗑️  All seed data removed successfully!");
  },
};
