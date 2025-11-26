import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";
import S3Service from "../../utils/S3Service.js";
import { CryptoService } from "../../utils/cryptoService.js";

export class AdminKycService {
  static async getAllKyc(currentUser, options = {}) {
    try {
      const {
        status = "ALL",
        page = 1,
        limit = 10,
        sort = "desc",
        search,
      } = options;
      const offset = (page - 1) * limit;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      // Get all users in admin's hierarchy
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);

      if (hierarchyUsers.length === 0) {
        // AUDIT LOG FOR EMPTY RESULT
        await AuditService.createLog({
          action: "GET_ALL_KYC",
          entity: "UserKyc",
          performedByType: currentUser.role,
          performedById: currentUser.id,
          description: "Admin viewed KYC applications - No users in hierarchy",
          status: "SUCCESS",
        });

        return {
          kycs: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        };
      }

      let whereCondition = {
        userId: { [Op.in]: hierarchyUsers },
      };

      if (status && status !== "ALL") {
        whereCondition.status = status;
      }

      if (search) {
        whereCondition[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { "$user.email$": { [Op.iLike]: `%${search}%` } },
          { "$user.phoneNumber$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: kycs } = await models.UserKyc.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: models.User,
            as: "user",
            attributes: ["id", "email", "phoneNumber", "username"],
            include: [
              {
                model: models.User,
                as: "parent",
                attributes: ["firstName", "lastName", "username"],
              },
            ],
          },
          {
            model: models.Address,
            as: "address",
            include: [
              { model: models.City, as: "city", attributes: ["cityName"] },
              { model: models.State, as: "state", attributes: ["stateName"] },
            ],
          },
        ],
        order: [["createdAt", sort.toUpperCase()]],
        limit,
        offset,
        distinct: true,
      });

      const formattedKycs = kycs.map((kyc) => ({
        id: kyc.id,
        profile: {
          name: `${kyc.firstName} ${kyc.lastName}`,
          userId: kyc.userId,
          email: kyc.user.email,
          phone: kyc.user.phoneNumber,
          photo: kyc.photo,
          username: kyc.user.username,
        },
        parent: {
          username: kyc.user.parent?.username || "N/A",
          name: kyc.user.parent
            ? `${kyc.user.parent.firstName} ${kyc.user.parent.lastName}`
            : "N/A",
        },
        location: {
          city: kyc.address?.city?.cityName || "-",
          state: kyc.address?.state?.stateName || "-",
          address: kyc.address?.address || "-",
          pinCode: kyc.address?.pinCode || "-",
        },
        status: kyc.status,
        type: kyc.type,
        createdAt: kyc.createdAt,
      }));

      // AUDIT LOG FOR GET ALL
      await AuditService.createLog({
        action: "GET_ALL_KYC",
        entity: "UserKyc",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin viewed KYC applications in their hierarchy. Users: ${hierarchyUsers.length}, Filters: status=${status}, search=${search}`,
        status: "SUCCESS",
      });

      return {
        kycs: formattedKycs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      // AUDIT LOG FOR FAILED GET ALL
      await AuditService.createLog({
        action: "GET_ALL_KYC",
        entity: "UserKyc",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Admin failed to get KYC applications",
        status: "FAILED",
        errorMessage: error.message,
      });

      throw ApiError.internal(
        `Failed to get KYC applications: ${error.message}`
      );
    }
  }

  static async getKycById(kycId, currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      const kyc = await models.UserKyc.findByPk(kycId, {
        include: [
          {
            model: models.User,
            as: "user",
            attributes: ["id", "email", "phoneNumber", "username"],
            include: [
              {
                model: models.User,
                as: "parent",
                attributes: [
                  "firstName",
                  "lastName",
                  "username",
                  "hierarchyLevel",
                  "hierarchyPath",
                ],
              },
            ],
          },
          {
            model: models.Address,
            as: "address",
            include: [
              { model: models.City, as: "city", attributes: ["cityName"] },
              { model: models.State, as: "state", attributes: ["stateName"] },
            ],
          },
          {
            model: models.PiiConsent,
            as: "piiConsents",
            attributes: ["piiType", "piiHash"],
          },
        ],
      });

      if (!kyc) {
        throw ApiError.notFound("KYC application not found");
      }

      // Check if admin has access to this KYC
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);
      if (!hierarchyUsers.includes(kyc.userId)) {
        // AUDIT LOG FOR UNAUTHORIZED ACCESS
        await AuditService.createLog({
          action: "GET_KYC_BY_ID",
          entity: "UserKyc",
          entityId: kycId,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          description: `Admin attempted to access unauthorized KYC: ${kycId}`,
          status: "FAILED",
          errorMessage: "Unauthorized access to KYC",
        });

        throw ApiError.forbidden(
          "You don't have permission to access this KYC"
        );
      }

      // Decrypt PII data for admin
      const piiData = await Promise.all(
        kyc.piiConsents.map(async (pii) => {
          try {
            const decryptedValue = CryptoService.decrypt(pii.piiHash);
            return {
              type: pii.piiType,
              value: decryptedValue,
            };
          } catch (error) {
            return {
              type: pii.piiType,
              value: `[Encrypted Data - ${pii.piiHash.slice(0, 8)}...]`,
            };
          }
        })
      );

      // AUDIT LOG FOR GET BY ID
      await AuditService.createLog({
        action: "GET_KYC_BY_ID",
        entity: "UserKyc",
        entityId: kycId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin viewed KYC details for: ${kyc.firstName} ${kyc.lastName}`,
        status: "SUCCESS",
      });

      return {
        id: kyc.id,
        profile: {
          name: `${kyc.firstName} ${kyc.lastName}`,
          userId: kyc.userId,
          gender: kyc.gender,
          dob: kyc.dob,
          fatherName: kyc.fatherName,
          email: kyc.user.email,
          phone: kyc.user.phoneNumber,
        },
        parent: {
          username: kyc.user.parent?.username || "N/A",
          name: kyc.user.parent
            ? `${kyc.user.parent.firstName} ${kyc.user.parent.lastName}`
            : "N/A",
          hierarchyLevel: kyc.user.parent?.hierarchyLevel,
          hierarchyPath: kyc.user.parent?.hierarchyPath || "N/A",
        },
        documents: piiData,
        location: {
          id: kyc.address?.id,
          city: kyc.address?.city?.cityName || "-",
          state: kyc.address?.state?.stateName || "-",
          address: kyc.address?.address || "-",
          pinCode: kyc.address?.pinCode || "-",
        },
        status: kyc.status,
        files: {
          photo: kyc.photo,
          panFile: kyc.panFile,
          aadhaarFile: kyc.aadhaarFile,
          addressProofFile: kyc.addressProofFile,
        },
        rejectReason: kyc.kycRejectionReason,
        createdAt: kyc.createdAt,
        updatedAt: kyc.updatedAt,
      };
    } catch (error) {
      // AUDIT LOG FOR FAILED GET BY ID
      await AuditService.createLog({
        action: "GET_KYC_BY_ID",
        entity: "UserKyc",
        entityId: kycId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Admin failed to get KYC details",
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to get KYC: ${error.message}`);
    }
  }

  static async createKyc(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { files, ...kycData } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      // Check if user exists and is in admin's hierarchy
      const userExists = await models.User.findByPk(kycData.userId);
      if (!userExists) {
        throw ApiError.notFound("User not found");
      }

      // Check if user is in admin's hierarchy
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);
      if (!hierarchyUsers.includes(kycData.userId)) {
        throw ApiError.forbidden(
          "You can only create KYC for users in your hierarchy"
        );
      }

      // Check if KYC already exists for this user
      const existingKyc = await models.UserKyc.findOne({
        where: { userId: kycData.userId },
      });

      if (existingKyc) {
        throw ApiError.conflict("KYC already exists for this user");
      }

      // Check if address exists
      const addressExists = await models.Address.findByPk(kycData.addressId);
      if (!addressExists) {
        throw ApiError.notFound("Address not found");
      }

      // Upload files to S3
      const panUrl = await S3Service.upload(
        files.panFile[0].buffer,
        "user-kyc"
      );
      const photoUrl = await S3Service.upload(
        files.photo[0].buffer,
        "user-kyc"
      );
      const aadhaarUrl = await S3Service.upload(
        files.aadhaarFile[0].buffer,
        "user-kyc"
      );
      const addressProofUrl = await S3Service.upload(
        files.addressProofFile[0].buffer,
        "user-kyc"
      );

      if (!panUrl || !photoUrl || !aadhaarUrl || !addressProofUrl) {
        throw ApiError.internal("Failed to upload one or more KYC documents");
      }

      // Create KYC
      const kyc = await models.UserKyc.create(
        {
          userId: kycData.userId,
          firstName: kycData.firstName.trim(),
          lastName: kycData.lastName.trim(),
          fatherName: kycData.fatherName.trim(),
          dob: new Date(kycData.dob),
          gender: kycData.gender,
          addressId: kycData.addressId,
          panFile: panUrl,
          aadhaarFile: aadhaarUrl,
          addressProofFile: addressProofUrl,
          photo: photoUrl,
          status: "PENDING",
          type: "USER_KYC",
        },
        { transaction }
      );

      // Create PII consents
      await models.PiiConsent.bulkCreate(
        [
          {
            userId: kycData.userId,
            userKycId: kyc.id,
            piiType: "PAN",
            piiHash: CryptoService.encrypt(kycData.panNumber.toUpperCase()),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            scope: "KYC_VERIFICATION",
          },
          {
            userId: kycData.userId,
            userKycId: kyc.id,
            piiType: "AADHAAR",
            piiHash: CryptoService.encrypt(kycData.aadhaarNumber),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            scope: "KYC_VERIFICATION",
          },
        ],
        { transaction }
      );

      // AUDIT LOG FOR CREATE
      await AuditService.createLog({
        action: "CREATE_KYC",
        entity: "UserKyc",
        entityId: kyc.id,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        newValues: {
          userId: kycData.userId,
          firstName: kycData.firstName,
          lastName: kycData.lastName,
        },
        description: `Admin created KYC for user: ${kycData.firstName} ${kycData.lastName}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return kyc;
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED CREATE
      await AuditService.createLog({
        action: "CREATE_KYC",
        entity: "UserKyc",
        entityId: "new",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin failed to create KYC for user: ${payload.userId}`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to create KYC: ${error.message}`);
    }
  }

  static async updateKyc(kycId, currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { files, ...updateData } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      const existingKyc = await models.UserKyc.findByPk(kycId, { transaction });
      if (!existingKyc) {
        throw ApiError.notFound("KYC application not found");
      }

      // Check if admin has access to this KYC
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);
      if (!hierarchyUsers.includes(existingKyc.userId)) {
        throw ApiError.forbidden(
          "You don't have permission to update this KYC"
        );
      }

      const updateFields = {};
      const oldValues = {};
      const changedFields = [];

      // Update basic fields
      const fieldsToUpdate = [
        "firstName",
        "lastName",
        "fatherName",
        "gender",
        "addressId",
      ];
      fieldsToUpdate.forEach((field) => {
        if (
          updateData[field] !== undefined &&
          updateData[field] !== existingKyc[field]
        ) {
          updateFields[field] = updateData[field];
          oldValues[field] = existingKyc[field];
          changedFields.push(field);
        }
      });

      if (updateData.dob) {
        const newDob = new Date(updateData.dob);
        if (newDob.toISOString() !== existingKyc.dob.toISOString()) {
          updateFields.dob = newDob;
          oldValues.dob = existingKyc.dob;
          changedFields.push("dob");
        }
      }

      // Update files if provided
      if (files) {
        const fileUpdates = [
          { field: "panFile", file: files.panFile?.[0] },
          { field: "photo", file: files.photo?.[0] },
          { field: "aadhaarFile", file: files.aadhaarFile?.[0] },
          { field: "addressProofFile", file: files.addressProofFile?.[0] },
        ];

        for (const { field, file } of fileUpdates) {
          if (file) {
            const newUrl = await S3Service.upload(file.buffer, "user-kyc");
            if (newUrl) {
              updateFields[field] = newUrl;
              oldValues[field] = existingKyc[field];
              changedFields.push(field);
            }
          }
        }
      }

      // Reset status to PENDING if updating a rejected KYC
      if (existingKyc.status === "REJECTED") {
        updateFields.status = "PENDING";
        updateFields.kycRejectionReason = null;
        changedFields.push("status", "kycRejectionReason");
      }

      if (Object.keys(updateFields).length === 0) {
        throw ApiError.badRequest("No valid fields to update");
      }

      await existingKyc.update(updateFields, { transaction });

      const updatedKyc = await models.UserKyc.findByPk(kycId, { transaction });

      // AUDIT LOG FOR UPDATE
      await AuditService.createLog({
        action: "UPDATE_KYC",
        entity: "UserKyc",
        entityId: kycId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues: oldValues,
        newValues: updateFields,
        changedFields: changedFields,
        description: `Admin updated KYC: ${existingKyc.firstName} ${existingKyc.lastName}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return updatedKyc;
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED UPDATE
      await AuditService.createLog({
        action: "UPDATE_KYC",
        entity: "UserKyc",
        entityId: kycId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin failed to update KYC`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to update KYC: ${error.message}`);
    }
  }

  static async verifyKyc(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { id, status, kycRejectionReason } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      const kyc = await models.UserKyc.findByPk(id, {
        include: [
          {
            model: models.User,
            as: "user",
            attributes: ["id", "email"],
          },
        ],
        transaction,
      });

      if (!kyc) {
        throw ApiError.notFound("KYC application not found");
      }

      // Check if admin has permission to verify this KYC
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);
      if (!hierarchyUsers.includes(kyc.userId)) {
        // AUDIT LOG FOR UNAUTHORIZED VERIFICATION
        await AuditService.createLog({
          action: status === "VERIFIED" ? "VERIFY_KYC" : "REJECT_KYC",
          entity: "UserKyc",
          entityId: id,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          description: `Admin attempted to ${status === "VERIFIED" ? "verify" : "reject"} unauthorized KYC: ${id}`,
          status: "FAILED",
          errorMessage: "Unauthorized access to KYC",
        });

        throw ApiError.forbidden(
          "You don't have permission to verify this KYC"
        );
      }

      const oldStatus = kyc.status;

      // Update KYC status
      await kyc.update(
        {
          status,
          kycRejectionReason: status === "REJECTED" ? kycRejectionReason : null,
          verifiedByType: currentUser.role,
          verifiedById: currentUser.id,
          verifiedAt: new Date(),
        },
        { transaction }
      );

      // Update user's KYC verification status
      await models.User.update(
        {
          isKycVerified: status === "VERIFIED",
        },
        {
          where: { id: kyc.userId },
          transaction,
        }
      );

      // AUDIT LOG FOR VERIFICATION
      await AuditService.createLog({
        action: status === "VERIFIED" ? "VERIFY_KYC" : "REJECT_KYC",
        entity: "UserKyc",
        entityId: id,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues: { status: oldStatus },
        newValues: {
          status,
          ...(status === "REJECTED" && { kycRejectionReason }),
        },
        description: `Admin ${status === "VERIFIED" ? "verified" : "rejected"} KYC for user: ${kyc.user.email}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return kyc;
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED VERIFICATION
      await AuditService.createLog({
        action: payload.status === "VERIFIED" ? "VERIFY_KYC" : "REJECT_KYC",
        entity: "UserKyc",
        entityId: payload.id,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin failed to ${payload.status === "VERIFIED" ? "verify" : "reject"} KYC`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to verify KYC: ${error.message}`);
    }
  }

  // Helper method to get all users in admin's hierarchy
  static async getHierarchyUsers(adminId) {
    const getAllChildrenIds = async (parentId) => {
      const children = await models.User.findAll({
        where: { parentId },
        attributes: ["id"],
        include: [
          {
            model: models.Role,
            attributes: ["name"],
          },
        ],
      });

      let allIds = [];

      for (const child of children) {
        // Exclude SUPER ADMIN from hierarchy
        if (child.role.name.toUpperCase() !== "SUPER ADMIN") {
          allIds.push(child.id);
          const grandchildrenIds = await getAllChildrenIds(child.id);
          allIds = [...allIds, ...grandchildrenIds];
        }
      }

      return allIds;
    };

    return await getAllChildrenIds(adminId);
  }
}

export default AdminKycService;
