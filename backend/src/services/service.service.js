import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";

export class ServiceProviderService {
  static async create(payload, files) {
    const {
      code,
      name,
      description,
      isActive,
      parentId = null,
      keyValueInputNumber = 1,
    } = payload;
    const existingCode = await Prisma.serviceProvider.findUnique({
      where: { code },
    });

    if (existingCode) {
      throw ApiError.conflict("Service Provider code already exists", 400);
    }

    let hierarchyLevel = "1";
    let hierarchyPath = code;

    // Handle parent hierarchy if provided
    if (parentId) {
      const parent = await Prisma.serviceProvider.findUnique({
        where: { id: parentId },
      });

      if (!parent) {
        throw ApiError.notFound("Parent service provider not found", 404);
      }

      // Get all siblings to determine position
      const siblings = await Prisma.serviceProvider.findMany({
        where: { parentId },
        orderBy: { createdAt: "asc" },
      });

      const siblingCount = siblings.length;

      // Format hierarchyLevel as parentLevel/position
      if (parent.hierarchyLevel.includes("/")) {
        // If parent already has relative format, use parent's first part
        const parentLevelParts = parent.hierarchyLevel.split("/");
        hierarchyLevel = `${parentLevelParts[0]}/${siblingCount + 1}`;
      } else {
        // If parent is root level
        hierarchyLevel = `${parent.hierarchyLevel}/${siblingCount + 1}`;
      }

      hierarchyPath = `${parent.hierarchyPath}/${code}`;
    } else {
      // For root services, count existing root services
      const rootServices = await Prisma.serviceProvider.findMany({
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
      });

      const rootCount = rootServices.length;
      hierarchyLevel = `${rootCount + 1}`;
    }

    let uploaded = null;
    if (files?.icon?.length > 0) {
      const iconFile = files.icon[0];
      if (iconFile && iconFile.path) {
        uploaded = await S3Service.upload(iconFile.path, "services");
      }
    }

    const createData = {
      name,
      code,
      description: description ?? null,
      iconUrl: uploaded ?? null,
      isActive: isActive ?? true,
      hierarchyLevel,
      hierarchyPath,
      parentId: parentId || null,
      keyValueInputNumber,
    };

    try {
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
            },
          },
        },
      });

      return serviceProvider;
    } catch (error) {
      throw ApiError.internal("Failed to create service provider", 500);
    } finally {
      if (files?.icon) {
        await Helper.deleteOldImage(files.icon);
      }
    }
  }

  // Update method
  static async update(id, data) {
    const existing = await Prisma.serviceProvider.findUnique({
      where: { id },
    });
    if (!existing) throw ApiError.notFound("Service Provider not found");

    if (data.code && data.code !== existing.code) {
      const existingCode = await Prisma.serviceProvider.findUnique({
        where: { code: data.code },
      });
      if (existingCode) {
        throw ApiError.badRequest("Service Provider code already exists");
      }
    }

    const updateData = {
      updatedAt: new Date(),
    };

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.code !== undefined) {
      updateData.code = data.code;
      if (existing.parentId) {
        const parent = await Prisma.serviceProvider.findUnique({
          where: { id: existing.parentId },
        });
        if (parent) {
          updateData.hierarchyPath = `${parent.hierarchyPath}/${data.code}`;
        }
      } else {
        updateData.hierarchyPath = data.code;
      }
    }

    if (data.name !== undefined) {
      updateData.name = data.name || null;
    }

    if (data.config !== undefined) {
      updateData.config = data.config;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    // Handle parent change
    if (data.parentId !== undefined) {
      if (data.parentId === null) {
        // Remove parent - make it root
        const rootServices = await Prisma.serviceProvider.findMany({
          where: { parentId: null },
          orderBy: { createdAt: "asc" },
        });
        updateData.parentId = null;
        updateData.hierarchyLevel = `${rootServices.length + 1}`;
        updateData.hierarchyPath = data.code || existing.code;
      } else if (data.parentId !== existing.parentId) {
        // Change parent
        const newParent = await Prisma.serviceProvider.findUnique({
          where: { id: data.parentId },
        });

        if (!newParent) {
          throw ApiError.notFound("New parent service provider not found");
        }

        // Get siblings count for new parent
        const siblings = await Prisma.serviceProvider.findMany({
          where: { parentId: data.parentId },
          orderBy: { createdAt: "asc" },
        });

        const siblingCount = siblings.length;
        updateData.parentId = data.parentId;

        // Format hierarchyLevel as parentLevel/position
        if (typeof newParent.hierarchyLevel === "number") {
          updateData.hierarchyLevel = `${newParent.hierarchyLevel}/${siblingCount + 1}`;
        } else {
          const parentLevelParts = newParent.hierarchyLevel.split("/");
          updateData.hierarchyLevel = `${parentLevelParts[0]}/${siblingCount + 1}`;
        }

        updateData.hierarchyPath = `${newParent.hierarchyPath}/${data.code || existing.code}`;
      }
    }

    const updated = await Prisma.serviceProvider.update({
      where: { id },
      data: updateData,
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
      },
    });

    return updated;
  }

  // Get all service providers (for ADMIN only)
  static async getAll() {
    const serviceProviders = await Prisma.serviceProvider.findMany({
      where: {
        parentId: null, // Only get root services
      },
      include: {
        subService: {
          include: {
            _count: {
              select: {
                subService: true,
                Transaction: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            subService: true,
            Transaction: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return serviceProviders;
  }

  // Get active service providers (for all users)
  static async getAllActive() {
    const serviceProviders = await Prisma.serviceProvider.findMany({
      where: {
        isActive: true,
      },
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
        _count: {
          select: {
            subService: true,
            Transaction: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return serviceProviders;
  }

  // Get services assigned to specific user
  static async getUserServices(userId) {
    const userPermissions = await Prisma.userPermission.findMany({
      where: {
        userId: userId,
        canView: true,
      },
      include: {
        service: {
          include: {
            parent: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            _count: {
              select: {
                subService: true,
                Transaction: true,
              },
            },
          },
        },
      },
    });

    return userPermissions.map((permission) => permission.service);
  }

  // Get active services assigned to specific user
  static async getUserActiveServices(userId) {
    const userPermissions = await Prisma.userPermission.findMany({
      where: {
        userId: userId,
        canView: true,
        service: {
          isActive: true,
        },
      },
      include: {
        service: {
          include: {
            parent: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            _count: {
              select: {
                subService: true,
                Transaction: true,
              },
            },
          },
        },
      },
    });

    return userPermissions.map((permission) => permission.service);
  }

  static async getById(id) {
    const serviceProvider = await Prisma.serviceProvider.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        subService: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
            hierarchyLevel: true,
          },
        },
        Transaction: {
          take: 5,
          orderBy: {
            initiatedAt: "desc", // FIXED: Use initiatedAt instead of createdAt
          },
          select: {
            id: true,
            amount: true,
            status: true,
            paymentType: true,
            initiatedAt: true, // FIXED: Use initiatedAt instead of createdAt
          },
        },
        CommissionSetting: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            commissionType: true,
            commissionValue: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            Transaction: true,
            CommissionSetting: true,
            subService: true,
          },
        },
      },
    });

    if (!serviceProvider) throw ApiError.notFound("Service Provider not found");
    return serviceProvider;
  }

  static async toggleActiveStatus(id, isActive) {
    const existing = await Prisma.serviceProvider.findUnique({
      where: { id },
      include: {
        subService: true,
      },
    });

    if (!existing) throw ApiError.notFound("Service Provider not found");

    if (existing.parentId === null) {
      await Prisma.$transaction([
        Prisma.serviceProvider.updateMany({
          where: { parentId: id },
          data: {
            isActive: isActive,
            updatedAt: new Date(),
          },
        }),
        Prisma.serviceProvider.update({
          where: { id },
          data: {
            isActive: isActive,
            updatedAt: new Date(),
          },
        }),
      ]);
    } else {
      await Prisma.serviceProvider.update({
        where: { id },
        data: {
          isActive: isActive,
          updatedAt: new Date(),
        },
      });
    }

    const updated = await Prisma.serviceProvider.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, code: true, name: true, isActive: true },
        },
        subService: {
          select: { id: true, code: true, name: true, isActive: true },
        },
      },
    });

    return updated;
  }

  static async delete(id) {
    const existing = await Prisma.serviceProvider.findUnique({
      where: { id },
    });
    if (!existing) throw ApiError.notFound("Service Provider not found");

    const relatedRecords = await Prisma.$transaction([
      Prisma.transaction.count({ where: { serviceId: id } }),
      Prisma.commissionSetting.count({ where: { serviceId: id } }),
      Prisma.commissionEarning.count({ where: { serviceId: id } }),
      Prisma.userPermission.count({ where: { serviceId: id } }),
      Prisma.rolePermission.count({ where: { serviceId: id } }),
      Prisma.apiEntity.count({ where: { serviceId: id } }),
      Prisma.ledgerEntry.count({ where: { serviceId: id } }),
      Prisma.serviceProvider.count({ where: { parentId: id } }),
    ]);

    const [
      transactionCount,
      commissionSettingCount,
      commissionEarningCount,
      userPermissionCount,
      rolePermissionCount,
      apiEntityCount,
      ledgerEntryCount,
      subServiceCount,
    ] = relatedRecords;

    if (
      transactionCount > 0 ||
      commissionSettingCount > 0 ||
      commissionEarningCount > 0 ||
      userPermissionCount > 0 ||
      rolePermissionCount > 0 ||
      apiEntityCount > 0 ||
      ledgerEntryCount > 0 ||
      subServiceCount > 0
    ) {
      throw ApiError.badRequest(
        `Cannot delete Service Provider with existing related records: 
        ${transactionCount} transactions, 
        ${commissionSettingCount} commission settings, 
        ${commissionEarningCount} commission earnings,
        ${userPermissionCount} user permissions,
        ${rolePermissionCount} role permissions,
        ${apiEntityCount} API entities,
        ${ledgerEntryCount} ledger entries,
        ${subServiceCount} sub-services`
      );
    }

    await Prisma.serviceProvider.delete({ where: { id } });
    return { message: "Service Provider deleted successfully" };
  }

  // Service Credential Management
  static async updateCredentials(serviceId, credentials) {
    const existing = await Prisma.serviceProvider.findUnique({
      where: { id: serviceId },
    });

    if (!existing) throw ApiError.notFound("Service Provider not found");

    const updated = await Prisma.serviceProvider.update({
      where: { id: serviceId },
      data: {
        config: {
          ...existing.config,
          credentials: credentials,
        },
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  static async getCredentials(serviceId) {
    const service = await Prisma.serviceProvider.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        code: true,
        name: true,
        config: true,
      },
    });

    if (!service) throw ApiError.notFound("Service Provider not found");

    return {
      id: service.id,
      code: service.code,
      name: service.name,
      credentials: service.config?.credentials || {},
    };
  }
}
