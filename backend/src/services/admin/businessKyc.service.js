import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";
import S3Service from "../../utils/S3Service.js";
import { CryptoService } from "../../utils/cryptoService.js";

export class AdminBusinessKycService {
  static async getBusinessKycById(businessKycId, currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      const businessKyc = await models.BusinessKyc.findByPk(businessKycId, {
        include: [
          {
            model: models.User,
            as: "user",
            attributes: [
              "id",
              "email",
              "phoneNumber",
              "username",
              "firstName",
              "lastName",
            ],
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

      if (!businessKyc) {
        throw ApiError.notFound("Business KYC application not found");
      }

      // Check if admin has access to this Business KYC
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);
      if (!hierarchyUsers.includes(businessKyc.userId)) {
        // AUDIT LOG FOR UNAUTHORIZED ACCESS
        await AuditService.createLog({
          action: "GET_BUSINESS_KYC_BY_ID",
          entity: "BusinessKyc",
          entityId: businessKycId,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          description: `Admin attempted to access unauthorized Business KYC: ${businessKycId}`,
          status: "FAILED",
          errorMessage: "Unauthorized access to Business KYC",
        });

        throw ApiError.forbidden(
          "You don't have permission to access this Business KYC"
        );
      }

      // Decrypt PII data for admin
      const piiData = await Promise.all(
        businessKyc.piiConsents.map(async (pii) => {
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
        action: "GET_BUSINESS_KYC_BY_ID",
        entity: "BusinessKyc",
        entityId: businessKycId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin viewed Business KYC details for: ${businessKyc.businessName}`,
        status: "SUCCESS",
      });

      return {
        id: businessKyc.id,
        profile: {
          businessName: businessKyc.businessName,
          businessType: businessKyc.businessType,
          userId: businessKyc.userId,
          userName: `${businessKyc.user.firstName} ${businessKyc.user.lastName}`,
          email: businessKyc.user.email,
          phone: businessKyc.user.phoneNumber,
        },
        parent: {
          username: businessKyc.user.parent?.username || "N/A",
          name: businessKyc.user.parent
            ? `${businessKyc.user.parent.firstName} ${businessKyc.user.parent.lastName}`
            : "N/A",
          hierarchyLevel: businessKyc.user.parent?.hierarchyLevel,
          hierarchyPath: businessKyc.user.parent?.hierarchyPath || "N/A",
        },
        documents: piiData,
        additionalInfo: {
          udhyamAadhar: businessKyc.udhyamAadhar,
          cin: businessKyc.cin,
          partnerKycNumbers: businessKyc.partnerKycNumbers,
          directorKycNumbers: businessKyc.directorKycNumbers,
        },
        location: {
          id: businessKyc.address?.id,
          city: businessKyc.address?.city?.cityName || "-",
          state: businessKyc.address?.state?.stateName || "-",
          address: businessKyc.address?.address || "-",
          pinCode: businessKyc.address?.pinCode || "-",
        },
        status: businessKyc.status,
        files: {
          panFile: businessKyc.panFile,
          gstFile: businessKyc.gstFile,
          udhyamAadhar: businessKyc.udhyamAadhar,
          brDoc: businessKyc.brDoc,
          partnershipDeed: businessKyc.partnershipDeed,
          moaFile: businessKyc.moaFile,
          aoaFile: businessKyc.aoaFile,
          directorShareholding: businessKyc.directorShareholding,
        },
        rejectReason: businessKyc.rejectionReason,
        createdAt: businessKyc.createdAt,
        updatedAt: businessKyc.updatedAt,
      };
    } catch (error) {
      // AUDIT LOG FOR FAILED GET BY ID
      await AuditService.createLog({
        action: "GET_BUSINESS_KYC_BY_ID",
        entity: "BusinessKyc",
        entityId: businessKycId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Admin failed to get Business KYC details",
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to get Business KYC: ${error.message}`);
    }
  }

  static async createBusinessKyc(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { files, ...businessKycData } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      // Check if user exists and is in admin's hierarchy
      const userExists = await models.User.findByPk(businessKycData.userId);
      if (!userExists) {
        throw ApiError.notFound("User not found");
      }

      // Check if user is in admin's hierarchy
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);
      if (!hierarchyUsers.includes(businessKycData.userId)) {
        throw ApiError.forbidden(
          "You can only create Business KYC for users in your hierarchy"
        );
      }

      // Check if Business KYC already exists for this user
      const existingBusinessKyc = await models.BusinessKyc.findOne({
        where: { userId: businessKycData.userId },
      });

      if (existingBusinessKyc) {
        throw ApiError.conflict("Business KYC already exists for this user");
      }

      // Check if address exists
      const addressExists = await models.Address.findByPk(
        businessKycData.addressId
      );
      if (!addressExists) {
        throw ApiError.notFound("Address not found");
      }

      // Upload required files to S3
      const panUrl = await S3Service.upload(
        files.panFile[0].buffer,
        "business-kyc"
      );
      const gstUrl = await S3Service.upload(
        files.gstFile[0].buffer,
        "business-kyc"
      );

      if (!panUrl || !gstUrl) {
        throw ApiError.internal("Failed to upload required KYC documents");
      }

      // Upload optional files based on business type
      const uploadOptionalFile = async (fileArray, fieldName) => {
        if (fileArray && fileArray[0]) {
          return await S3Service.upload(fileArray[0].buffer, "business-kyc");
        }
        return null;
      };

      const optionalFiles = {
        udhyamAadhar: await uploadOptionalFile(
          files.udhyamAadhar,
          "udhyamAadhar"
        ),
        brDoc: await uploadOptionalFile(files.brDoc, "brDoc"),
        partnershipDeed: await uploadOptionalFile(
          files.partnershipDeed,
          "partnershipDeed"
        ),
        moaFile: await uploadOptionalFile(files.moaFile, "moaFile"),
        aoaFile: await uploadOptionalFile(files.aoaFile, "aoaFile"),
        directorShareholding: await uploadOptionalFile(
          files.directorShareholding,
          "directorShareholding"
        ),
      };

      // Create Business KYC
      const businessKyc = await models.BusinessKyc.create(
        {
          userId: businessKycData.userId,
          businessName: businessKycData.businessName.trim(),
          businessType: businessKycData.businessType,
          addressId: businessKycData.addressId,
          panFile: panUrl,
          gstFile: gstUrl,
          udhyamAadhar: optionalFiles.udhyamAadhar,
          brDoc: optionalFiles.brDoc,
          partnershipDeed: optionalFiles.partnershipDeed,
          partnerKycNumbers: businessKycData.partnerKycNumbers,
          cin: businessKycData.cin,
          moaFile: optionalFiles.moaFile,
          aoaFile: optionalFiles.aoaFile,
          directorKycNumbers: businessKycData.directorKycNumbers,
          directorShareholding: optionalFiles.directorShareholding,
          status: "PENDING",
        },
        { transaction }
      );

      // Create PII consents for PAN and GST
      await models.PiiConsent.bulkCreate(
        [
          {
            userId: businessKycData.userId,
            businessKycId: businessKyc.id,
            piiType: "PAN",
            piiHash: CryptoService.encrypt(
              businessKycData.panNumber.toUpperCase()
            ),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            scope: "BUSINESS_KYC_VERIFICATION",
          },
          {
            userId: businessKycData.userId,
            businessKycId: businessKyc.id,
            piiType: "GST",
            piiHash: CryptoService.encrypt(businessKycData.gstNumber),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            scope: "BUSINESS_KYC_VERIFICATION",
          },
        ],
        { transaction }
      );

      // AUDIT LOG FOR CREATE
      await AuditService.createLog({
        action: "CREATE_BUSINESS_KYC",
        entity: "BusinessKyc",
        entityId: businessKyc.id,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        newValues: {
          userId: businessKycData.userId,
          businessName: businessKycData.businessName,
          businessType: businessKycData.businessType,
        },
        description: `Admin created Business KYC for: ${businessKycData.businessName}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return businessKyc;
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED CREATE
      await AuditService.createLog({
        action: "CREATE_BUSINESS_KYC",
        entity: "BusinessKyc",
        entityId: "new",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin failed to create Business KYC for user: ${payload.userId}`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        `Failed to create Business KYC: ${error.message}`
      );
    }
  }

  static async updateBusinessKyc(businessKycId, currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { files, ...updateData } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      const existingBusinessKyc = await models.BusinessKyc.findByPk(
        businessKycId,
        { transaction }
      );
      if (!existingBusinessKyc) {
        throw ApiError.notFound("Business KYC application not found");
      }

      // Check if admin has access to this Business KYC
      const hierarchyUsers = await this.getHierarchyUsers(currentUser.id);
      if (!hierarchyUsers.includes(existingBusinessKyc.userId)) {
        throw ApiError.forbidden(
          "You don't have permission to update this Business KYC"
        );
      }

      const updateFields = {};
      const oldValues = {};
      const changedFields = [];

      // Update basic fields
      const fieldsToUpdate = [
        "businessName",
        "businessType",
        "addressId",
        "udhyamAadhar",
        "cin",
        "partnerKycNumbers",
        "directorKycNumbers",
      ];
      fieldsToUpdate.forEach((field) => {
        if (
          updateData[field] !== undefined &&
          updateData[field] !== existingBusinessKyc[field]
        ) {
          updateFields[field] = updateData[field];
          oldValues[field] = existingBusinessKyc[field];
          changedFields.push(field);
        }
      });

      // Update files if provided
      if (files) {
        const fileUpdates = [
          { field: "panFile", file: files.panFile?.[0] },
          { field: "gstFile", file: files.gstFile?.[0] },
          { field: "udhyamAadhar", file: files.udhyamAadhar?.[0] },
          { field: "brDoc", file: files.brDoc?.[0] },
          { field: "partnershipDeed", file: files.partnershipDeed?.[0] },
          { field: "moaFile", file: files.moaFile?.[0] },
          { field: "aoaFile", file: files.aoaFile?.[0] },
          {
            field: "directorShareholding",
            file: files.directorShareholding?.[0],
          },
        ];

        for (const { field, file } of fileUpdates) {
          if (file) {
            const newUrl = await S3Service.upload(file.buffer, "business-kyc");
            if (newUrl) {
              updateFields[field] = newUrl;
              oldValues[field] = existingBusinessKyc[field];
              changedFields.push(field);
            }
          }
        }
      }

      // Reset status to PENDING if updating a rejected Business KYC
      if (existingBusinessKyc.status === "REJECTED") {
        updateFields.status = "PENDING";
        updateFields.rejectionReason = null;
        changedFields.push("status", "rejectionReason");
      }

      if (Object.keys(updateFields).length === 0) {
        throw ApiError.badRequest("No valid fields to update");
      }

      await existingBusinessKyc.update(updateFields, { transaction });

      const updatedBusinessKyc = await models.BusinessKyc.findByPk(
        businessKycId,
        { transaction }
      );

      // AUDIT LOG FOR UPDATE
      await AuditService.createLog({
        action: "UPDATE_BUSINESS_KYC",
        entity: "BusinessKyc",
        entityId: businessKycId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues: oldValues,
        newValues: updateFields,
        changedFields: changedFields,
        description: `Admin updated Business KYC: ${existingBusinessKyc.businessName}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return updatedBusinessKyc;
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED UPDATE
      await AuditService.createLog({
        action: "UPDATE_BUSINESS_KYC",
        entity: "BusinessKyc",
        entityId: businessKycId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin failed to update Business KYC`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        `Failed to update Business KYC: ${error.message}`
      );
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

export default AdminBusinessKycService;
