import { CryptoService } from "../utils/cryptoService.js";

export default {
  async up(queryInterface, Sequelize) {
    const { v4: uuidv4 } = await import("uuid");

    // First, completely reset the database by disabling foreign key checks
    console.log("🔄 Resetting database...");

    try {
      // Disable foreign key checks
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

      // Truncate all tables in correct order to avoid foreign key constraints
      await queryInterface.bulkDelete("wallets", null, {});
      await queryInterface.bulkDelete("root_wallets", null, {});
      await queryInterface.bulkDelete("employees", null, {});
      await queryInterface.bulkDelete("users", null, {});
      await queryInterface.bulkDelete("departments", null, {});
      await queryInterface.bulkDelete("cities", null, {});
      await queryInterface.bulkDelete("states", null, {});
      await queryInterface.bulkDelete("roots", null, {}); // Move roots before roles
      await queryInterface.bulkDelete("roles", null, {});

      // Re-enable foreign key checks
      await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
      console.log("✅ Database reset successfully");
    } catch (error) {
      console.log(
        "ℹ️  Database was already empty or reset failed, continuing..."
      );
    }

    // Generate UUIDs upfront for consistent references
    const rootUserId = uuidv4();
    const adminUserId = uuidv4();
    const stateHeadUserId = uuidv4();
    const masterDistributorUserId = uuidv4();
    const distributorUserId = uuidv4();
    const retailerUserId = uuidv4();

    // Create UUIDs for roles
    const rootRoleId = uuidv4();
    const adminRoleId = uuidv4();
    const stateHeadRoleId = uuidv4();
    const masterDistributorRoleId = uuidv4();
    const distributorRoleId = uuidv4();
    const retailerRoleId = uuidv4();

    // Create UUIDs for departments (employee roles)
    const hrDepartmentByRootId = uuidv4();
    const hrDepartmentByAdminId = uuidv4();

    // Create UUIDs for employees
    const rootHrEmployeeId = uuidv4();
    const adminHrEmployeeId = uuidv4();

    // Create UUIDs for other entities
    const maharashtraStateId = uuidv4();
    const mumbaiCityId = uuidv4();
    const adminWalletId = uuidv4();
    const stateHeadWalletId = uuidv4();
    const masterDistributorWalletId = uuidv4();
    const distributorWalletId = uuidv4();
    const retailerWalletId = uuidv4();
    const rootPrimaryWalletId = uuidv4();

    const currentTime = new Date();

    try {
      // Insert initial roles FIRST
      await queryInterface.bulkInsert("roles", [
        {
          id: rootRoleId,
          name: "ROOT",
          hierarchy_level: 0,
          description: "Root Administrator - Full System Access",
          created_by_type: "ROOT",
          created_by_id: rootUserId, // This will be created later, but we need the reference
          created_at: currentTime,
          updated_at: currentTime,
        },
        {
          id: adminRoleId,
          name: "ADMIN",
          hierarchy_level: 1,
          description: "System Administrator",
          created_by_type: "ROOT",
          created_by_id: rootUserId,
          created_at: currentTime,
          updated_at: currentTime,
        },
        {
          id: stateHeadRoleId,
          name: "STATE_HEAD",
          hierarchy_level: 2,
          description: "State Head",
          created_by_type: "ROOT",
          created_by_id: rootUserId,
          created_at: currentTime,
          updated_at: currentTime,
        },
        {
          id: masterDistributorRoleId,
          name: "MASTER_DISTRIBUTOR",
          hierarchy_level: 3,
          description: "Master Distributor",
          created_by_type: "ROOT",
          created_by_id: rootUserId,
          created_at: currentTime,
          updated_at: currentTime,
        },
        {
          id: distributorRoleId,
          name: "DISTRIBUTOR",
          hierarchy_level: 4,
          description: "Distributor",
          created_by_type: "ROOT",
          created_by_id: rootUserId,
          created_at: currentTime,
          updated_at: currentTime,
        },
        {
          id: retailerRoleId,
          name: "RETAILER",
          hierarchy_level: 5,
          description: "Retailer",
          created_by_type: "ROOT",
          created_by_id: rootUserId,
          created_at: currentTime,
          updated_at: currentTime,
        },
      ]);
      console.log("✅ Roles created");

      // Create Root user AFTER roles are created
      const rootPassword = CryptoService.encrypt("Root@123");
      await queryInterface.bulkInsert("roots", [
        {
          id: rootUserId,
          role_id: rootRoleId,
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
          created_at: currentTime,
          updated_at: currentTime,
          deleted_at: null,
        },
      ]);
      console.log("✅ Root user created");

      // Now update the roles with the correct created_by_id
      await queryInterface.sequelize.query(`
        UPDATE roles SET created_by_id = '${rootUserId}' WHERE id IN (
          '${rootRoleId}', '${adminRoleId}', '${stateHeadRoleId}', 
          '${masterDistributorRoleId}', '${distributorRoleId}', '${retailerRoleId}'
        )
      `);
      console.log("✅ Roles updated with root user reference");

      // Create HR Department by ROOT
      await queryInterface.bulkInsert("departments", [
        {
          id: hrDepartmentByRootId,
          name: "HR_ROOT",
          description: "Human Resources Department created by ROOT",
          created_by_type: "ROOT",
          created_by_id: rootUserId,
          created_at: currentTime,
          updated_at: currentTime,
        },
      ]);
      console.log("✅ HR_ROOT department created");

      // Create ADMIN user
      const adminPassword = CryptoService.encrypt("Admin@123");
      const adminPin = CryptoService.encrypt("123456");
      const adminCustomerId = "10000001";

      await queryInterface.bulkInsert("users", [
        {
          id: adminUserId,
          customer_id: adminCustomerId,
          username: "admin",
          first_name: "System",
          last_name: "Admin",
          profile_image: null,
          email: "admin@system.com",
          phone_number: "9999999991",
          password: adminPassword,
          transaction_pin: adminPin,
          role_id: adminRoleId,
          parent_id: null,
          hierarchy_level: 1,
          hierarchy_path: `1.${adminUserId}`,
          status: "ACTIVE",
          is_kyc_verified: true,
          refresh_token: null,
          password_reset_token: null,
          password_reset_expires: null,
          email_verification_token: null,
          email_verified_at: currentTime,
          email_verification_token_expires: null,
          last_login_at: null,
          deactivation_reason: null,
          created_at: currentTime,
          updated_at: currentTime,
          deleted_at: null,
          created_by_id: rootUserId,
          created_by_type: "ROOT"
        },
      ]);
      console.log("✅ Admin user created");

      // Create HR Department by ADMIN
      await queryInterface.bulkInsert("departments", [
        {
          id: hrDepartmentByAdminId,
          name: "HR_ADMIN",
          description: "Human Resources Department created by ADMIN",
          created_by_type: "ADMIN",
          created_by_id: adminUserId,
          created_at: currentTime,
          updated_at: currentTime,
        },
      ]);
      console.log("✅ HR_ADMIN department created");

      // Create remaining business users in hierarchical order
      const stateHeadPassword = CryptoService.encrypt("State@123");
      const stateHeadPin = CryptoService.encrypt("123456");
      const stateHeadCustomerId = "10000002";

      await queryInterface.bulkInsert("users", [
        {
          id: stateHeadUserId,
          customer_id: stateHeadCustomerId,
          username: "statehead_mh",
          first_name: "Maharashtra",
          last_name: "Head",
          profile_image: null,
          email: "statehead.mh@system.com",
          phone_number: "9999999992",
          password: stateHeadPassword,
          transaction_pin: stateHeadPin,
          role_id: stateHeadRoleId,
          parent_id: adminUserId,
          hierarchy_level: 2,
          hierarchy_path: `1.${adminUserId}.2.${stateHeadUserId}`,
          status: "ACTIVE",
          is_kyc_verified: true,
          refresh_token: null,
          password_reset_token: null,
          password_reset_expires: null,
          email_verification_token: null,
          email_verified_at: currentTime,
          email_verification_token_expires: null,
          last_login_at: null,
          deactivation_reason: null,
          created_at: currentTime,
          updated_at: currentTime,
          deleted_at: null,
        },
      ]);
      console.log("✅ STATE_HEAD user created");

      const masterDistributorPassword = CryptoService.encrypt("Master@123");
      const masterDistributorPin = CryptoService.encrypt("123456");
      const masterDistributorCustomerId = "10000003";

      await queryInterface.bulkInsert("users", [
        {
          id: masterDistributorUserId,
          customer_id: masterDistributorCustomerId,
          username: "master_dist",
          first_name: "Mumbai",
          last_name: "Master",
          profile_image: null,
          email: "master.dist@system.com",
          phone_number: "9999999993",
          password: masterDistributorPassword,
          transaction_pin: masterDistributorPin,
          role_id: masterDistributorRoleId,
          parent_id: stateHeadUserId,
          hierarchy_level: 3,
          hierarchy_path: `1.${adminUserId}.2.${stateHeadUserId}.3.${masterDistributorUserId}`,
          status: "ACTIVE",
          is_kyc_verified: true,
          refresh_token: null,
          password_reset_token: null,
          password_reset_expires: null,
          email_verification_token: null,
          email_verified_at: currentTime,
          email_verification_token_expires: null,
          last_login_at: null,
          deactivation_reason: null,
          created_at: currentTime,
          updated_at: currentTime,
          deleted_at: null,
        },
      ]);
      console.log("✅ MASTER_DISTRIBUTOR user created");

      const distributorPassword = CryptoService.encrypt("Distributor@123");
      const distributorPin = CryptoService.encrypt("123456");
      const distributorCustomerId = "10000004";

      await queryInterface.bulkInsert("users", [
        {
          id: distributorUserId,
          customer_id: distributorCustomerId,
          username: "distributor_w",
          first_name: "Western",
          last_name: "Distributor",
          profile_image: null,
          email: "distributor.w@system.com",
          phone_number: "9999999994",
          password: distributorPassword,
          transaction_pin: distributorPin,
          role_id: distributorRoleId,
          parent_id: masterDistributorUserId,
          hierarchy_level: 4,
          hierarchy_path: `1.${adminUserId}.2.${stateHeadUserId}.3.${masterDistributorUserId}.4.${distributorUserId}`,
          status: "ACTIVE",
          is_kyc_verified: true,
          refresh_token: null,
          password_reset_token: null,
          password_reset_expires: null,
          email_verification_token: null,
          email_verified_at: currentTime,
          email_verification_token_expires: null,
          last_login_at: null,
          deactivation_reason: null,
          created_at: currentTime,
          updated_at: currentTime,
          deleted_at: null,
        },
      ]);
      console.log("✅ DISTRIBUTOR user created");

      const retailerPassword = CryptoService.encrypt("Retailer@123");
      const retailerPin = CryptoService.encrypt("123456");
      const retailerCustomerId = "10000005";

      await queryInterface.bulkInsert("users", [
        {
          id: retailerUserId,
          customer_id: retailerCustomerId,
          username: "retailer_1",
          first_name: "City",
          last_name: "Retailer",
          profile_image: null,
          email: "retailer.1@system.com",
          phone_number: "9999999995",
          password: retailerPassword,
          transaction_pin: retailerPin,
          role_id: retailerRoleId,
          parent_id: distributorUserId,
          hierarchy_level: 5,
          hierarchy_path: `1.${adminUserId}.2.${stateHeadUserId}.3.${masterDistributorUserId}.4.${distributorUserId}.5.${retailerUserId}`,
          status: "ACTIVE",
          is_kyc_verified: true,
          refresh_token: null,
          password_reset_token: null,
          password_reset_expires: null,
          email_verification_token: null,
          email_verified_at: currentTime,
          email_verification_token_expires: null,
          last_login_at: null,
          deactivation_reason: null,
          created_at: currentTime,
          updated_at: currentTime,
          deleted_at: null,
        },
      ]);
      console.log("✅ RETAILER user created");

      // Create employees
      const employeePassword = CryptoService.encrypt("Employee@123");

      await queryInterface.bulkInsert("employees", [
        {
          id: rootHrEmployeeId,
          username: "hr_root",
          first_name: "HR",
          last_name: "Manager",
          profile_image: null,
          email: "hr.root@system.com",
          phone_number: "9999999996",
          password: employeePassword,
          department_id: hrDepartmentByRootId,
          status: "ACTIVE",
          refresh_token: null,
          password_reset_token: null,
          password_reset_expires: null,
          last_login_at: null,
          hierarchy_level: 1,
          hierarchy_path: "0.1",
          created_by_type: "ROOT",
          created_by_id: rootUserId,
          root_id: rootUserId,
          user_id: null,
          created_at: currentTime,
          updated_at: currentTime,
          deleted_at: null,
          deactivation_reason: null,
        },
      ]);
      console.log("✅ HR_ROOT employee created");

      await queryInterface.bulkInsert("employees", [
        {
          id: adminHrEmployeeId,
          username: "hr_admin",
          first_name: "HR",
          last_name: "Manager",
          profile_image: null,
          email: "hr.admin@system.com",
          phone_number: "9999999997",
          password: employeePassword,
          department_id: hrDepartmentByAdminId,
          status: "ACTIVE",
          refresh_token: null,
          password_reset_token: null,
          password_reset_expires: null,
          last_login_at: null,
          hierarchy_level: 2,
          hierarchy_path: "0.2",
          created_by_type: "ADMIN",
          created_by_id: adminUserId,
          root_id: null,
          user_id: adminUserId,
          created_at: currentTime,
          updated_at: currentTime,
          deleted_at: null,
          deactivation_reason: null,
        },
      ]);
      console.log("✅ HR_ADMIN employee created");

      // Insert states and cities
      await queryInterface.bulkInsert("states", [
        {
          id: maharashtraStateId,
          state_name: "Maharashtra",
          state_code: "MH",
          created_at: currentTime,
          updated_at: currentTime,
        },
      ]);

      await queryInterface.bulkInsert("cities", [
        {
          id: mumbaiCityId,
          city_name: "Mumbai",
          city_code: "MUM",
          created_at: currentTime,
          updated_at: currentTime,
        },
      ]);
      console.log("✅ States and cities created");

      // Create wallets for BUSINESS USERS ONLY (not root user)
      await queryInterface.bulkInsert("wallets", [
        {
          id: adminWalletId,
          user_id: adminUserId,
          wallet_type: "PRIMARY",
          balance: 500000.0,
          available_balance: 500000.0,
          hold_balance: 0.0,
          currency: "INR",
          is_active: true,
          version: 1,
          created_at: currentTime,
          updated_at: currentTime,
        },
        {
          id: stateHeadWalletId,
          user_id: stateHeadUserId,
          wallet_type: "PRIMARY",
          balance: 250000.0,
          available_balance: 250000.0,
          hold_balance: 0.0,
          currency: "INR",
          is_active: true,
          version: 1,
          created_at: currentTime,
          updated_at: currentTime,
        },
        {
          id: masterDistributorWalletId,
          user_id: masterDistributorUserId,
          wallet_type: "PRIMARY",
          balance: 100000.0,
          available_balance: 100000.0,
          hold_balance: 0.0,
          currency: "INR",
          is_active: true,
          version: 1,
          created_at: currentTime,
          updated_at: currentTime,
        },
        {
          id: distributorWalletId,
          user_id: distributorUserId,
          wallet_type: "PRIMARY",
          balance: 50000.0,
          available_balance: 50000.0,
          hold_balance: 0.0,
          currency: "INR",
          is_active: true,
          version: 1,
          created_at: currentTime,
          updated_at: currentTime,
        },
        {
          id: retailerWalletId,
          user_id: retailerUserId,
          wallet_type: "PRIMARY",
          balance: 25000.0,
          available_balance: 25000.0,
          hold_balance: 0.0,
          currency: "INR",
          is_active: true,
          version: 1,
          created_at: currentTime,
          updated_at: currentTime,
        },
      ]);
      console.log("✅ User wallets created");

      // Create Root wallet (for root user in roots table)
      await queryInterface.bulkInsert("root_wallets", [
        {
          id: rootPrimaryWalletId,
          root_id: rootUserId,
          wallet_type: "PRIMARY",
          balance: 5000000.0,
          available_balance: 5000000.0,
          hold_balance: 0.0,
          currency: "INR",
          is_active: true,
          version: 1,
          created_at: currentTime,
          updated_at: currentTime,
        },
      ]);
      console.log("✅ Root wallet created");

      console.log("🎉 Database seeded successfully!");
      console.log("📋 Business Users Hierarchy:");
      console.log(
        "   ROOT → ADMIN → STATE_HEAD → MASTER_DISTRIBUTOR → DISTRIBUTOR → RETAILER"
      );
      console.log("");
      console.log("🔐 Default Credentials - Business Users:");
      console.log("   ROOT: root@system.com / Root@123");
      console.log("   ADMIN: admin@system.com / Admin@123");
      console.log("   STATE_HEAD: statehead.mh@system.com / State@123");
      console.log("   MASTER_DISTRIBUTOR: master.dist@system.com / Master@123");
      console.log("   DISTRIBUTOR: distributor.w@system.com / Distributor@123");
      console.log("   RETAILER: retailer.1@system.com / Retailer@123");
      console.log("");
      console.log("👥 Employee Credentials:");
      console.log("   HR Manager (ROOT): hr.root@system.com / Employee@123");
      console.log("   HR Manager (ADMIN): hr.admin@system.com / Employee@123");
    } catch (error) {
      console.error("❌ Seeding failed:", error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Disable foreign key checks for clean removal
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    await queryInterface.bulkDelete("wallets", null, {});
    await queryInterface.bulkDelete("root_wallets", null, {});
    await queryInterface.bulkDelete("employees", null, {});
    await queryInterface.bulkDelete("users", null, {});
    await queryInterface.bulkDelete("departments", null, {});
    await queryInterface.bulkDelete("cities", null, {});
    await queryInterface.bulkDelete("states", null, {});
    await queryInterface.bulkDelete("roots", null, {});
    await queryInterface.bulkDelete("roles", null, {});

    // Re-enable foreign key checks
    await queryInterface.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("🗑️  All seed data removed successfully!");
  },
};
