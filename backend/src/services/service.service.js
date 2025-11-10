import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { CryptoService } from "../utils/cryptoService.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";
import { TestingAPI } from "./testing/testingAPIs.js";

export class ServiceProviderService {
  // create services
  static async create(payload, files) {
    const {
      code,
      name,
      description,
      isActive,
      parentId = null,
      keyValueInputNumber = 0,
    } = payload;

    let uploaded = null;

    try {
      // Validate required fields
      if (!code || !name) {
        throw ApiError.badRequest("Code and name are required", 400);
      }

      // Check if code already exists
      const existingCode = await Prisma.serviceProvider.findUnique({
        where: { code },
      });

      if (existingCode) {
        throw ApiError.conflict("Service Provider code already exists", 400);
      }

      let hierarchyLevel = "";
      let hierarchyPath = "";

      if (parentId) {
        // ---- If has parent ----
        const parent = await Prisma.serviceProvider.findUnique({
          where: { id: parentId },
        });

        if (!parent) {
          throw ApiError.notFound("Parent service provider not found", 404);
        }

        if (parent.parentId === null && !this.isValidRootParent(parent)) {
          throw ApiError.badRequest("Invalid parent hierarchy", 400);
        }

        // Get siblings count for the next position
        const siblingCount = await Prisma.serviceProvider.count({
          where: { parentId },
        });

        const nextPosition = siblingCount + 1;

        // Build hierarchy level (shorter, for display)
        hierarchyLevel = `${parent.hierarchyLevel}.${nextPosition}`;

        // Build hierarchy path (full path for querying)
        hierarchyPath = `${parent.hierarchyPath}/${nextPosition}`;
      } else {
        // ---- Root-level ----
        const rootCount = await Prisma.serviceProvider.count({
          where: { parentId: null },
        });

        const nextPosition = rootCount + 1;

        // For root elements, level and path are the same
        hierarchyLevel = `${nextPosition}`;
        hierarchyPath = `${nextPosition}`;
      }

      // Validate hierarchy values
      if (!hierarchyLevel || !hierarchyPath) {
        throw ApiError.internal("Failed to generate hierarchy data", 500);
      }

      //  Safe image upload (optional)
      const iconFile = files?.icon?.[0];
      if (iconFile?.path) {
        try {
          uploaded = await S3Service.upload(iconFile.path, "services");
        } catch (uploadError) {
          console.error(" Failed to upload icon:", uploadError);
          throw ApiError.internal("Failed to upload service icon", 500);
        }
      }

      const createData = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description ? description.trim() : null,
        iconUrl: uploaded,
        isActive: isActive ?? true,
        hierarchyLevel,
        hierarchyPath,
        parentId,
        keyValueInputNumber: this.sanitizeKeyValueInput(keyValueInputNumber),
      };

      const serviceProvider = await Prisma.serviceProvider.create({
        data: createData,
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
              hierarchyLevel: true,
              hierarchyPath: true,
            },
          },
          subService: {
            select: {
              id: true,
              code: true,
              name: true,
              hierarchyLevel: true,
            },
          },
        },
      });

      return serviceProvider;
    } catch (error) {
      // Clean up uploaded file if creation fails
      if (uploaded) {
        try {
          await S3Service.delete(uploaded);
        } catch (cleanupError) {
          throw ApiError.internal(
            "Failed to clean up uploaded file:",
            cleanupError
          );
        }
      }

      // Handle specific Prisma errors
      if (error.code === "P2002") {
        throw ApiError.conflict("Service Provider code already exists", 400);
      } else if (error.code === "P2003") {
        throw ApiError.badRequest("Invalid parent reference", 400);
      }

      // Re-throw if it's already an ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internal("Failed to create service provider", 500);
    } finally {
      // Clean up temporary files
      if (files?.icon?.[0]?.path) {
        try {
          await Helper.deleteOldImage(files.icon);
        } catch (fileError) {
          console.error("❌ Failed to clean up temporary files:", fileError);
        }
      }
    }
  }

  static isValidRootParent(parent) {
    // Validate that root parents have consistent hierarchy
    return (
      parent.hierarchyLevel === parent.hierarchyPath &&
      !parent.hierarchyLevel.includes("/") &&
      !parent.hierarchyLevel.includes(".")
    );
  }

  static sanitizeKeyValueInput(input) {
    if (input === undefined || input === null) return "1";

    const num = parseInt(input);
    return isNaN(num) || num < 1 ? "1" : num.toString();
  }

  static validateHierarchyPath(path) {
    if (!path || typeof path !== "string") return false;

    const pathRegex = /^(\d+)(\/\d+)*$/;
    return pathRegex.test(path);
  }

  static async getHierarchyTree() {
    const allServices = await Prisma.serviceProvider.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        hierarchyLevel: true,
        hierarchyPath: true,
        parentId: true,
      },
      orderBy: { hierarchyPath: "asc" },
    });

    return allServices;
  }

  // Get all service (api integration and services)
  static async getAll() {
    try {
      const allServiceProviders = await Prisma.serviceProvider.findMany({
        where: { parentId: null },
        include: {
          subService: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!allServiceProviders || allServiceProviders.length === 0) {
        throw ApiError.notFound("Services not found");
      }

      const decryptedServices = await Promise.all(
        allServiceProviders.map(async (service) => {
          try {
            let decryptedEnvConfig = [];

            if (service.envConfig && Array.isArray(service.envConfig)) {
              decryptedEnvConfig = await Promise.all(
                service.envConfig.map(async (env) => {
                  try {
                    const decryptedValue = CryptoService.decrypt(env.value);
                    return {
                      key: env.key,
                      value: decryptedValue,
                    };
                  } catch (envError) {
                    return {
                      key: env.key,
                      value: `[DECRYPTION_FAILED]`,
                      _error: true,
                    };
                  }
                })
              );
            }

            return {
              ...service,
              envConfig: decryptedEnvConfig,
            };
          } catch (serviceError) {
            return {
              ...service,
              envConfig: service.envConfig || [],
              _processingError: true,
            };
          }
        })
      );

      const activeServices = decryptedServices.filter((service) => {
        const hasSubServices =
          Array.isArray(service.subService) && service.subService.length > 0;

        if (hasSubServices) {
          return (
            service.apiIntegrationStatus === true &&
            service.subService.some((sub) => sub.apiIntegrationStatus === true)
          );
        } else {
          return service.apiIntegrationStatus === true;
        }
      });

      return {
        success: true,
        allServiceProviders: decryptedServices,
        activeServices,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal("Failed to fetch services");
    }
  }

  // Update environment configuration
  static async updateEnvConfig(id, data) {
    try {
      const existing = await Prisma.serviceProvider.findUnique({
        where: { id },
        include: { subService: true },
      });

      if (!existing) {
        throw ApiError.notFound("Service Provider not found");
      }

      const updateData = {
        updatedAt: new Date(),
        envConfig: [],
      };

      if (data.envConfig && Array.isArray(data.envConfig)) {
        const validEnvs = data.envConfig.filter(
          (env) => env.key && env.key.trim() && env.value && env.value.trim()
        );

        if (validEnvs.length > 0) {
          const encryptedEnvConfig = validEnvs.map((env) => ({
            key: env.key.trim(),
            value: CryptoService.encrypt(env.value.trim()),
          }));

          updateData.apiIntegrationStatus = true;
          updateData.isActive = true;
          updateData.envConfig = encryptedEnvConfig;
        } else {
          updateData.apiIntegrationStatus = false;
          updateData.isActive = false;
        }
      } else {
        updateData.apiIntegrationStatus = false;
        updateData.isActive = false;
      }

      if (data.subServices && Array.isArray(data.subServices)) {
        for (const subService of data.subServices) {
          try {
            await Prisma.serviceProvider.update({
              where: { id: subService.id },
              data: {
                apiIntegrationStatus: subService.apiIntegrationStatus || false,
                updatedAt: new Date(),
              },
            });
          } catch (error) {
            // Continue with other sub-services even if one fails
          }
        }
      }

      const updated = await Prisma.serviceProvider.update({
        where: { id },
        data: updateData,
        include: {
          subService: {
            select: {
              id: true,
              name: true,
              code: true,
              apiIntegrationStatus: true,
              isActive: true,
            },
          },
        },
      });

      return updated;
    } catch (error) {
      throw ApiError.internal(
        `Failed to update environment config: ${error.message}`
      );
    }
  }

  // only service status change
  static async toggleServiceStatus(id) {
    try {
      const existing = await Prisma.serviceProvider.findUnique({
        where: { id },
        include: {
          parent: true,
          subService: true,
        },
      });

      if (!existing) {
        throw ApiError.notFound("Service not found");
      }

      const newStatus = !existing.isActive;

      if (existing.subService.length > 0 && !newStatus) {
        await Prisma.serviceProvider.updateMany({
          where: {
            OR: [{ id }, { parentId: id }],
          },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });

        return await Prisma.serviceProvider.findUnique({
          where: { id },
          include: {
            subService: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        });
      }

      if (existing.parentId && !existing.parent.isActive && newStatus) {
        throw ApiError.badRequest(
          `Cannot enable "${existing.name}" - parent "${existing.parent.name}" is disabled`
        );
      }

      const updated = await Prisma.serviceProvider.update({
        where: { id },
        data: {
          isActive: newStatus,
          updatedAt: new Date(),
        },
      });

      if (!updated)
        throw ApiError.internal("Failed to change active/inactive status");

      return updated;
    } catch (error) {
      throw ApiError.internal(
        `Failed to toggle service status: ${error.message}`
      );
    }
  }

  // only api intigration status change
  static async toggleApiIntigrationStatus(id) {
    try {
      const existing = await Prisma.serviceProvider.findUnique({
        where: { id },
        include: {
          parent: true,
          subService: true,
        },
      });

      if (!existing) {
        throw ApiError.notFound("Service not found");
      }

      const newStatus = !existing.isActive;
      const newApiStatus = !existing.apiIntegrationStatus;

      if (existing.subService.length > 0 && !newStatus && !newApiStatus) {
        await Prisma.serviceProvider.updateMany({
          where: {
            OR: [{ id }, { parentId: id }],
          },
          data: {
            isActive: false,
            apiIntegrationStatus: false,
            updatedAt: new Date(),
          },
        });

        return await Prisma.serviceProvider.findUnique({
          where: { id },
          include: {
            subService: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        });
      }

      if (
        existing.parentId &&
        !existing.parent.isActive &&
        newStatus &&
        newApiStatus
      ) {
        throw ApiError.badRequest(
          `Cannot enable "${existing.name}" - parent "${existing.parent.name}" is disabled`
        );
      }

      const updated = await Prisma.serviceProvider.update({
        where: { id },
        data: {
          isActive: newStatus,
          apiIntegrationStatus: newApiStatus,
          updatedAt: new Date(),
        },
      });

      if (!updated)
        throw ApiError.internal("Failed to change active/inactive status");

      return updated;
    } catch (error) {
      throw ApiError.internal(
        `Failed to toggle service status: ${error.message}`
      );
    }
  }

  // Test API connection
  static async testApiConnection(serviceProviderId, envConfig) {
    const serviceProvider = await Prisma.serviceProvider.findUnique({
      where: { id: serviceProviderId },
    });

    if (!serviceProvider) {
      throw new ApiError.notFound("Service Provider not found");
    }

    if (envConfig.length !== Number(serviceProvider.keyValueInputNumber)) {
      throw ApiError.badRequest(
        `${serviceProvider.keyValueInputNumber} Numbers of Filed are required`
      );
    }

    const testResult = await this.performConnectionTest(
      serviceProvider.code,
      envConfig
    );

    return testResult;
  }

  // Perform actual connection test based on service type
  static async performConnectionTest(serviceCode, envConfig) {
    const serviceTests = {
      RAZORPAY: this.testRazorpayConnection,
      AEPS: this.testAepsConnection,
      BBPS: this.testBbpsConnection,
      DMT: this.testDmtConnection,
      RECHARGE: this.testRechargeConnection,
      CC_PAYOUT: this.testCcPayoutConnection,
    };

    const testFunction =
      serviceTests[serviceCode] || this.testGenericConnection;
    return testFunction(envConfig);
  }

  static async testRazorpayConnection(envConfig) {
    const apiKeyEnv = envConfig.find((env) => env.key === "RAZORPAY_KEY_ID");
    const apiSecretEnv = envConfig.find(
      (env) => env.key === "RAZORPAY_KEY_SECRET"
    );

    if (!apiKeyEnv?.value) {
      throw ApiError.badRequest("Missing Razorpay API Key");
    }
    if (!apiSecretEnv?.value) {
      throw ApiError.badRequest("Missing Razorpay API Secret");
    }

    const apiKey = apiKeyEnv.value.trim();
    const apiSecret = apiSecretEnv.value.trim();

    const result = await TestingAPI.razorpay({ apiKey, apiSecret });
    return result;
  }

  static async testAepsConnection(envConfig) {
    // Mock AEPS connection test
    const hasRequiredFields = envConfig.some(
      (env) => env.key && env.key.includes("aadhaar") && env.value
    );

    return {
      success: hasRequiredFields,
      message: hasRequiredFields
        ? "AEPS connection test successful"
        : "Missing Aadhaar configuration",
    };
  }

  static async testBbpsConnection(envConfig) {
    // Mock BBPS connection test
    const hasApiKeys = envConfig.some(
      (env) =>
        env.key &&
        (env.key.includes("api") || env.key.includes("key")) &&
        env.value
    );

    return {
      success: hasApiKeys,
      message: hasApiKeys
        ? "BBPS connection test successful"
        : "Missing API keys for BBPS",
    };
  }

  static async testGenericConnection(envConfig) {
    // Generic connection test
    const hasValidConfig =
      envConfig.length > 0 && envConfig.every((env) => env.key && env.value);

    return {
      success: hasValidConfig,
      message: hasValidConfig
        ? "Connection test successful"
        : "Invalid environment configuration",
    };
  }
}
