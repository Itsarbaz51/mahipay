import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";
import Helper from "../utils/helper.js";
import { CryptoService } from "../utils/cryptoService.js";
import AuditLogService from "./auditLog.service.js";

class KycServices {
  static async getAllByAdmin(
    params,
    currentUserId = null,
    req = null,
    res = null
  ) {
    const {
      userId,
      status = "ALL",
      page = 1,
      limit = 10,
      sort = "desc",
      search,
    } = params;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const sortOrder = sort === "asc" ? "asc" : "desc";

    // --- Fetch from DB
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_LIST_RETRIEVAL_FAILED",
        entityType: "KYC",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "USER_NOT_FOUND",
          requestedBy: currentUserId,
          targetUserId: userId,
        },
      });
      throw ApiError.notFound("User not found");
    }

    let targetUserIds = [];

    // ✅ MODIFIED: Recursive function to get all children IDs
    const getAllChildrenIds = async (parentId) => {
      const children = await Prisma.user.findMany({
        where: { parentId },
        select: {
          id: true,
          role: true,
        },
      });

      let allIds = [];

      for (const child of children) {
        // SUPER ADMIN ko exclude karo
        if (child.role.name.toUpperCase() !== "SUPER ADMIN") {
          allIds.push(child.id);
          // Recursively get grandchildren
          const grandchildrenIds = await getAllChildrenIds(child.id);
          allIds = [...allIds, ...grandchildrenIds];
        }
      }

      return allIds;
    };

    if (
      user.role.name.toUpperCase() === "ADMIN" ||
      user.role.type === "employee"
    ) {
      // ✅ ADMIN ke liye recursive children IDs
      targetUserIds = await getAllChildrenIds(userId);

      // Agar koi children nahi hai to empty array return karo
      if (targetUserIds.length === 0) {
        const emptyResult = {
          data: [],
          meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
        };
        return emptyResult;
      }
    } else {
      // Other users ke liye direct children (without recursion)
      const directChildren = await Prisma.user.findMany({
        where: {
          parentId: userId,
          role: {
            name: {
              not: "SUPER ADMIN",
            },
          },
        },
        select: { id: true },
      });
      targetUserIds = directChildren.map((child) => child.id);
    }

    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId: { in: targetUserIds },
      ...(status &&
        status.toUpperCase() !== "ALL" && { status: status.toUpperCase() }),
      ...(search && {
        user: {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phoneNumber: { contains: search } },
          ],
        },
      }),
    };

    const kycs = await Prisma.userKyc.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sortOrder },
      include: {
        user: {
          include: {
            parent: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
              },
            },
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        address: {
          select: {
            address: true,
            pinCode: true,
            city: true,
            state: true,
          },
        },
        piiConsents: true,
      },
    });

    // ✅ EXTRA SAFETY: Frontend data mein bhi SUPER ADMIN ko filter karo
    const filteredKycs = kycs.filter(
      (kyc) => kyc.user.role.name.toUpperCase() !== "SUPER ADMIN"
    );

    const total = await Prisma.userKyc.count({ where });

    const frontendData = filteredKycs.map((kyc) => {
      const pii = kyc.piiConsents.map((p) => {
        const decrypted = CryptoService.decrypt(p.piiHash);
        if (p.piiType === "PAN") {
          return {
            type: "PAN",
            value: decrypted.slice(0, 2) + "-XXX-XXX-" + decrypted.slice(-2),
          };
        }
        if (p.piiType === "AADHAAR") {
          return {
            type: "AADHAAR",
            value: "XXXX-XXXX-" + decrypted.slice(-4),
          };
        }
        return { type: p.piiType, value: "******" };
      });

      return {
        id: kyc.id,
        profile: {
          name: `${kyc.user.firstName} ${kyc.user.lastName}`,
          userId: kyc.userId,
          email: kyc.user.email,
          phone: kyc.user.phoneNumber,
          photo: kyc.photo || null,
          username: kyc.user.username,
          role: kyc.user.role.name,
        },
        parent: {
          username: kyc.user.parent?.username || "N/A",
          name: kyc.user.parent
            ? `${kyc.user.parent.firstName} ${kyc.user.parent.lastName}`
            : "N/A",
        },
        documents: pii,
        location: {
          city: kyc.address?.city?.cityName || "-",
          state: kyc.address?.state?.stateName || "-",
          address: kyc.address?.address || "-",
          pinCode: kyc.address?.pinCode || "-",
        },
        type: kyc.type,
        status: kyc.status,
        createdAt: kyc.createdAt,
      };
    });

    const result = {
      data: frontendData,
      meta: {
        page: pageNum,
        limit: limitNum,
        total, // ✅ Original total use karo (frontendData.length nahi)
        totalPages: Math.ceil(total / limitNum),
        userRole: user.role.name,
        userRoleType: user.role.type,
        isEmployeeViewingAllData: user.role.type === "employee",
        totalChildrenCount: targetUserIds.length, // ✅ Debugging ke liye
      },
    };

    return result;
  }

  static async showUserKyc(id, requestingUser) {
    const kyc = await Prisma.userKyc.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: {
        address: {
          select: {
            id: true,
            address: true,
            pinCode: true,
            city: { select: { cityName: true } },
            state: { select: { stateName: true } },
          },
        },
        user: {
          select: {
            email: true,
            phoneNumber: true,
            username: true,
            parent: {
              select: {
                phoneNumber: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                hierarchyPath: true,
                hierarchyLevel: true,
              },
            },
          },
        },
        piiConsents: { select: { piiType: true, piiHash: true } },
      },
    });

    if (!kyc) {
      return;
    }

    const kycWithRelations = kyc;

    const isOwner = requestingUser && kyc.userId === requestingUser.id;
    const isAdmin = requestingUser && requestingUser.role === "ADMIN";

    const pii = await Promise.all(
      kycWithRelations.piiConsents.map(async (p) => {
        try {
          const decryptedValue = await CryptoService.decrypt(p.piiHash);
          if (isAdmin || isOwner) {
            if (p.piiType === "AADHAAR" && decryptedValue.length === 12) {
              return {
                type: p.piiType,
                value: `${decryptedValue.slice(0, 4)}-${decryptedValue.slice(4, 8)}-${decryptedValue.slice(8)}`,
              };
            }
            return { type: p.piiType, value: decryptedValue };
          } else {
            let masked = "******";
            if (p.piiType === "PAN")
              masked = `${decryptedValue.slice(0, 2)}XXXX${decryptedValue.slice(-3)}`;
            else if (p.piiType === "AADHAAR")
              masked = `${decryptedValue.slice(0, 2)}XX-XXXX-${decryptedValue.slice(-4)}`;
            return { type: p.piiType, value: masked };
          }
        } catch (error) {
          return {
            type: p.piiType,
            value:
              isAdmin || isOwner
                ? `[Encrypted Data - ${p.piiHash.slice(0, 8)}...]`
                : "******",
          };
        }
      })
    );

    const result = {
      id: kyc.id,
      profile: {
        name: `${kycWithRelations?.firstName || ""} ${kycWithRelations?.lastName || ""}`.trim(),
        userId: kyc.userId,
        gender: kyc.gender || null,
        dob: kyc.dob || null,
        fatherName: kyc.fatherName || "-",
        email: kyc.user.email || "-",
        phone: kyc.user.phoneNumber || "-",
      },
      parent: {
        username: kyc.user.parent?.username || "N/A",
        name: kyc.user.parent
          ? `${kyc.user.parent.firstName} ${kyc.user.parent.lastName}`
          : "N/A",
        hierarchyLevel: kyc.user.parent?.hierarchyLevel,
        hierarchyPath: kyc.user.parent?.hierarchyPath || "N/A",
        email: kyc.user.parent?.email || "N/A",
        phone: kyc.user.parent?.phoneNumber || "N/A",
      },
      documents: pii,
      location: {
        id: kycWithRelations.address?.id || null,
        city: kycWithRelations.address?.city?.cityName || "-",
        state: kycWithRelations.address?.state?.stateName || "-",
        address: kycWithRelations.address?.address || "-",
        pinCode: kycWithRelations.address?.pinCode || "-",
      },
      status: kyc.status,
      files: {
        photo: kyc.photo,
        panFile: kyc.panFile,
        aadhaarFile: kyc.aadhaarFile,
        addressProofFile: kyc.addressProofFile,
      },
      rejectReason: kyc.kycRejectionReason || null,
      createdAt: kyc.createdAt,
      updatedAt: kyc.updatedAt,
    };

    return result;
  }

  static async storeUserKyc(payload, req = null, res = null) {
    let currentUserId = req.user.id;
    try {
      const userExists = await Prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!userExists) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "USER_NOT_FOUND",
            roleName: req.user.role,
            targetUserId: payload.userId,
            createdBy: currentUserId,
          },
        });
        throw ApiError.notFound("User not found");
      }

      const existingKyc = await Prisma.userKyc.findFirst({
        where: { userId: payload.userId },
      });

      if (existingKyc) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          entityId: existingKyc.id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "KYC_ALREADY_EXISTS",
            targetUserId: payload.userId,
            roleName: req.user.role,
            existingKycId: existingKyc.id,
            createdBy: currentUserId,
          },
        });
        throw ApiError.conflict("KYC already exists for this user");
      }

      const addressExists = await Prisma.address.findUnique({
        where: { id: payload.addressId },
        select: { id: true },
      });

      if (!addressExists) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "ADDRESS_NOT_FOUND",
            roleName: req.user.role,
            addressId: payload.addressId,
            createdBy: currentUserId,
          },
        });
        throw ApiError.notFound("Address not found");
      }

      const panUrl = await S3Service.upload(payload.panFile.path, "user-kyc");
      const photoUrl = await S3Service.upload(payload.photo.path, "user-kyc");
      const aadhaarUrl = await S3Service.upload(
        payload.aadhaarFile.path,
        "user-kyc"
      );
      const addressProofUrl = await S3Service.upload(
        payload.addressProofFile.path,
        "user-kyc"
      );

      if (!panUrl || !photoUrl || !aadhaarUrl || !addressProofUrl) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "FILE_UPLOAD_FAILED",
            panUploaded: !!panUrl,
            photoUploaded: !!photoUrl,
            aadhaarUploaded: !!aadhaarUrl,
            roleName: req.user.role,
            addressProofUploaded: !!addressProofUrl,
            createdBy: currentUserId,
          },
        });
        throw ApiError.internal("Failed to upload one or more KYC documents");
      }

      const createdKyc = await Prisma.userKyc.create({
        data: {
          userId: payload.userId,
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          fatherName: payload.fatherName.trim(),
          dob: new Date(payload.dob),
          gender: payload.gender,
          addressId: addressExists.id,
          panFile: panUrl,
          aadhaarFile: aadhaarUrl,
          addressProofFile: addressProofUrl,
          photo: photoUrl,
        },
      });

      if (!createdKyc) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "DATABASE_CREATION_FAILED",
            roleName: req.user.role,
            createdBy: currentUserId,
          },
        });
        throw ApiError.internal("Failed to create user kyc");
      }

      await Prisma.piiConsent.deleteMany({
        where: {
          userId: payload.userId,
          scope: "KYC_VERIFICATION",
        },
      });

      const createdPii = await Prisma.piiConsent.createMany({
        data: [
          {
            userId: payload.userId,
            userKycId: createdKyc.id,
            piiType: "PAN",
            piiHash: CryptoService.encrypt(payload.panNumber.toUpperCase()),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            scope: "KYC_VERIFICATION",
          },
          {
            userId: payload.userId,
            userKycId: createdKyc.id,
            piiType: "AADHAAR",
            piiHash: CryptoService.encrypt(payload.aadhaarNumber),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            scope: "KYC_VERIFICATION",
          },
        ],
      });

      if (!createdPii) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_CREATION_FAILED",
          entityType: "KYC",
          entityId: createdKyc.id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "PII_CREATION_FAILED",
            roleName: req.user.role,
            createdBy: currentUserId,
          },
        });
        throw ApiError.internal("Failed to create user kyc Pii");
      }

      // Audit log for successful KYC creation
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_CREATED",
        entityType: "KYC",
        entityId: createdKyc.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          targetUserId: payload.userId,
          userEmail: userExists.email,
          roleName: req.user.role,
          piiTypes: ["PAN", "AADHAAR"],
          createdBy: currentUserId,
        },
      });

      return {
        ...createdKyc,
        gender: createdKyc.gender,
        kycRejectionReason: createdKyc.kycRejectionReason ?? "",
      };
    } catch (error) {
      throw ApiError.internal("storeUserKyc failed:", error.message);
    } finally {
      const allFiles = [
        payload.panFile?.path,
        payload.photo?.path,
        payload.aadhaarFile?.path,
        payload.addressProofFile?.path,
      ].filter(Boolean);

      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath);
      }
    }
  }

  static async updateUserKyc(id, payload, req = null, res = null) {
    let currentUserId = req.user.id;
    try {
      const existingKyc = await Prisma.userKyc.findUnique({
        where: { id: id },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!existingKyc) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_UPDATE_FAILED",
          entityType: "KYC",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "KYC_NOT_FOUND",
            roleName: req.user.role,
            updatedBy: currentUserId,
          },
        });
        throw ApiError.notFound("KYC not found");
      }

      if (payload.userId && existingKyc.userId !== payload.userId) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_UPDATE_FAILED",
          entityType: "KYC",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "UNAUTHORIZED_ACCESS",
            kycUserId: existingKyc.userId,
            requestingUserId: payload.userId,
            roleName: req.user.role,
            updatedBy: currentUserId,
          },
        });
        throw ApiError.forbidden(
          "Access denied - you can only update your own KYC"
        );
      }

      const updates = {};
      const updatedFields = [];

      if (payload.firstName) {
        updates.firstName = payload.firstName.trim();
        updatedFields.push("firstName");
      }
      if (payload.lastName) {
        updates.lastName = payload.lastName.trim();
        updatedFields.push("lastName");
      }
      if (payload.fatherName) {
        updates.fatherName = payload.fatherName.trim();
        updatedFields.push("fatherName");
      }
      if (payload.gender) {
        updates.gender = payload.gender;
        updatedFields.push("gender");
      }
      if (payload.dob) {
        updates.dob = new Date(payload.dob);
        updatedFields.push("dob");
      }

      if (existingKyc.status === "REJECT") {
        updates.status = "PENDING";
        updates.kycRejectionReason = null;
        updatedFields.push("status", "kycRejectionReason");
      } else {
        if (payload.status) {
          updates.status = payload.status;
          updatedFields.push("status");
        }
        if (payload.kycRejectionReason !== undefined) {
          updates.kycRejectionReason = payload.kycRejectionReason;
          updatedFields.push("kycRejectionReason");
        }
      }

      const uploadTasks = [];
      const fileFields = [
        ["panFile", "panFile"],
        ["photo", "photo"],
        ["aadhaarFile", "aadhaarFile"],
        ["addressProofFile", "addressProofFile"],
      ];

      for (const [fileField, dbField] of fileFields) {
        const file = payload[fileField];
        if (file && typeof file === "object" && "path" in file) {
          uploadTasks.push(
            (async () => {
              const newUrl = await S3Service.upload(file.path, "user-kyc");
              if (newUrl) {
                const oldUrl = existingKyc[dbField];
                if (oldUrl) {
                  await S3Service.delete({ fileUrl: oldUrl });
                }
                updates[dbField] = newUrl;
                updatedFields.push(dbField);
              }
              return newUrl;
            })()
          );
        }
      }

      if (uploadTasks.length > 0) await Promise.all(uploadTasks);

      updates.updatedAt = new Date();

      const updatedKyc = await Prisma.userKyc.update({
        where: { id },
        data: updates,
      });

      if (!updatedKyc) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "KYC_UPDATE_FAILED",
          entityType: "KYC",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "DATABASE_UPDATE_FAILED",
            roleName: req.user.role,
            updatedBy: currentUserId,
          },
        });
        throw ApiError.internal("Failed to update user kyc");
      }

      // Audit log for successful KYC update
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_UPDATED",
        entityType: "KYC",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          updatedFields: updatedFields,
          previousStatus: existingKyc.status,
          newStatus: updatedKyc.status,
          roleName: req.user.role,
          userEmail: existingKyc.user.email,
          updatedBy: currentUserId,
        },
      });

      return {
        ...updatedKyc,
        gender: updatedKyc.gender,
        kycRejectionReason: updatedKyc.kycRejectionReason ?? "",
      };
    } catch (error) {
      console.error("updateUserKyc failed:", error);
      throw error;
    } finally {
      const allFiles = [
        payload.panFile?.path,
        payload.photo?.path,
        payload.aadhaarFile?.path,
        payload.addressProofFile?.path,
      ].filter(Boolean);

      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath);
      }
    }
  }

  static async verifyUserKyc(payload, req = null, res = null) {
    let currentUserId = req.user.id;
    let currentUserRole = req.user.role;

    // ✅ Pehle current user ka data fetch karo with role and hierarchy
    const currentUser = await Prisma.user.findUnique({
      where: { id: currentUserId },
      include: {
        role: true,
        children: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!currentUser) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: payload.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "CURRENT_USER_NOT_FOUND",
          roleName: currentUserRole,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.unauthorized("Current user not found");
    }

    // ✅ KYC record fetch karo with user hierarchy
    const existingKyc = await Prisma.userKyc.findFirst({
      where: { id: payload.id },
      include: {
        user: {
          include: {
            role: true,
            parent: {
              include: {
                role: true,
                parent: {
                  // Grandparent bhi include karo
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!existingKyc) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: payload.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "KYC_NOT_FOUND",
          roleName: currentUserRole,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.notFound("KYC not found");
    }

    // ✅ AUTHORIZATION CHECK
    let isAuthorized = false;

    // Case 1: SUPER ADMIN aur uska EMPLOYEE kisi bhi ADMIN ko verify kar sakta hai
    if (
      currentUserRole === "SUPER ADMIN" ||
      currentUser.role.type === "employee"
    ) {
      // Check if the KYC belongs to an ADMIN user
      if (existingKyc.user.role.name === "ADMIN") {
        isAuthorized = true;
      }
    }
    // Case 2: ADMIN apne hierarchy ke users ko verify kar sakta hai
    else if (currentUserRole === "ADMIN") {
      // Recursive function to check if target user is in current admin's hierarchy
      const isUserInHierarchy = async (adminId, targetUserId) => {
        // Direct children check
        const directChildren = await Prisma.user.findMany({
          where: { parentId: adminId },
          select: { id: true },
        });

        const directChildIds = directChildren.map((child) => child.id);
        if (directChildIds.includes(targetUserId)) {
          return true;
        }

        // Check grandchildren recursively
        for (const childId of directChildIds) {
          const isInChildHierarchy = await isUserInHierarchy(
            childId,
            targetUserId
          );
          if (isInChildHierarchy) {
            return true;
          }
        }

        return false;
      };

      isAuthorized = await isUserInHierarchy(currentUserId, existingKyc.userId);
    }
    // Case 3: EMPLOYEE apne admin ke hierarchy ke users ko verify kar sakta hai
    else if (currentUser.role.type === "employee" && currentUser.parentId) {
      // Employee ke parent (ADMIN) ki hierarchy check karo
      const isUserInHierarchy = async (adminId, targetUserId) => {
        const directChildren = await Prisma.user.findMany({
          where: { parentId: adminId },
          select: { id: true },
        });

        const directChildIds = directChildren.map((child) => child.id);
        if (directChildIds.includes(targetUserId)) {
          return true;
        }

        for (const childId of directChildIds) {
          const isInChildHierarchy = await isUserInHierarchy(
            childId,
            targetUserId
          );
          if (isInChildHierarchy) {
            return true;
          }
        }

        return false;
      };

      isAuthorized = await isUserInHierarchy(
        currentUser.parentId,
        existingKyc.userId
      );
    }

    // ✅ Agar authorized nahi hai to error throw karo
    if (!isAuthorized) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: existingKyc.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "UNAUTHORIZED_ACCESS",
          currentUserRole: currentUserRole,
          targetUserRole: existingKyc.user.role.name,
          targetUserId: existingKyc.userId,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.forbidden("You are not authorized to verify this KYC");
    }

    // ✅ Status validation
    const enumStatus = payload.status;

    if (!enumStatus) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: existingKyc.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "INVALID_STATUS",
          providedStatus: payload.status,
          roleName: currentUserRole,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.badRequest("Invalid status value");
    }

    if (enumStatus === "REJECT" && !payload.kycRejectionReason) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: existingKyc.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "MISSING_REJECTION_REASON",
          roleName: currentUserRole,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.badRequest(
        "Rejection reason is required when status is REJECTED"
      );
    }

    // ✅ KYC update karo
    const updateVerify = await Prisma.userKyc.update({
      where: { id: existingKyc.id },
      data: {
        status: { set: enumStatus },
        ...(enumStatus === "REJECT"
          ? { kycRejectionReason: payload.kycRejectionReason || null }
          : { kycRejectionReason: null }),
      },
    });

    if (!updateVerify) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: existingKyc.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "DATABASE_UPDATE_FAILED",
          roleName: currentUserRole,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.internal("Failed to verify user KYC");
    }

    // ✅ User update karo
    const updatedUser = await Prisma.user.update({
      where: { id: existingKyc.userId },
      data: {
        ...(enumStatus === "VERIFIED"
          ? { isKycVerified: true }
          : { isKycVerified: false }),
      },
    });

    if (!updatedUser) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_VERIFICATION_FAILED",
        entityType: "KYC",
        entityId: existingKyc.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "USER_UPDATE_FAILED",
          roleName: currentUserRole,
          verifiedBy: currentUserId,
        },
      });
      throw ApiError.internal("Failed to update user KYC status");
    }

    // ✅ Successful verification audit log
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: `KYC_${enumStatus}`,
      entityType: "KYC",
      entityId: existingKyc.id,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req ? Helper.generateCommonMetadata(req, res) : {}),
        previousStatus: existingKyc.status,
        newStatus: enumStatus,
        roleName: currentUserRole,
        rejectionReason: payload.kycRejectionReason || null,
        userEmail: existingKyc.user.email,
        targetUserRole: existingKyc.user.role.name,
        verifiedBy: currentUserId,
        authorizationType: isAuthorized ? "HIERARCHY_ACCESS" : "DIRECT_ACCESS",
      },
    });

    return {
      ...updateVerify,
      gender: updateVerify.gender,
      kycRejectionReason: updateVerify.kycRejectionReason ?? "",
    };
  }

  // SUPER ADMIN
  static async getAllBySuperAdmin(
    params,
    currentUserId = null,
    req = null,
    res = null
  ) {
    const {
      userId,
      status = "ALL",
      page = 1,
      limit = 10,
      sort = "desc",
      search,
    } = params;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const sortOrder = sort === "asc" ? "asc" : "desc";

    // --- Fetch from DB
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "KYC_LIST_RETRIEVAL_FAILED",
        entityType: "KYC",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "USER_NOT_FOUND",
          requestedBy: currentUserId,
          targetUserId: userId,
        },
      });
      throw ApiError.notFound("User not found");
    }

    const adminUsers = await Prisma.user.findMany({
      where: {
        parentId: userId,
        role: {
          name: "ADMIN",
        },
      },
      select: { id: true },
    });

    const targetUserIds = adminUsers.map((user) => user.id);

    if (targetUserIds.length === 0) {
      const emptyResult = {
        data: [],
        meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
      };
      return emptyResult;
    }

    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId: { in: targetUserIds },
      ...(status &&
        status.toUpperCase() !== "ALL" && { status: status.toUpperCase() }),
      ...(search && {
        user: {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phoneNumber: { contains: search } },
          ],
        },
      }),
    };

    const kycs = await Prisma.userKyc.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sortOrder },
      include: {
        user: {
          include: {
            parent: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        address: {
          select: {
            address: true,
            pinCode: true,
            city: true,
            state: true,
          },
        },
        piiConsents: true,
      },
    });

    const total = await Prisma.userKyc.count({ where });

    const frontendData = kycs.map((kyc) => {
      const pii = kyc.piiConsents.map((p) => {
        const decrypted = CryptoService.decrypt(p.piiHash);
        if (p.piiType === "PAN") {
          return {
            type: "PAN",
            value: decrypted.slice(0, 2) + "-XXX-XXX-" + decrypted.slice(-2),
          };
        }
        if (p.piiType === "AADHAAR") {
          return {
            type: "AADHAAR",
            value: "XXXX-XXXX-" + decrypted.slice(-4),
          };
        }
        return { type: p.piiType, value: "******" };
      });

      return {
        id: kyc.id,
        profile: {
          name: `${kyc.user.firstName} ${kyc.user.lastName}`,
          userId: kyc.userId,
          email: kyc.user.email,
          phone: kyc.user.phoneNumber,
          photo: kyc.photo || null,
          username: kyc.user.username,
        },
        parent: {
          username: kyc.user.parent?.username || "N/A",
          name: kyc.user.parent
            ? `${kyc.user.parent.firstName} ${kyc.user.parent.lastName}`
            : "N/A",
        },
        documents: pii,
        location: {
          city: kyc.address?.city?.cityName || "-",
          state: kyc.address?.state?.stateName || "-",
          address: kyc.address?.address || "-",
          pinCode: kyc.address?.pinCode || "-",
        },
        type: kyc.type,
        status: kyc.status,
        createdAt: kyc.createdAt,
      };
    });

    const result = {
      data: frontendData,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        userRole: user.role.name,
        userRoleType: user.role.type,
      },
    };

    return result;
  }
}

export default KycServices;
