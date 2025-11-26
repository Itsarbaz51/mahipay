import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

export class EmployeeKycService {
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

      const employeeExists = await models.Employee.findByPk(currentUser.id);
      if (!employeeExists) throw ApiError.notFound("Employee not found");

      // Get admin's hierarchy users that this employee can access
      const hierarchyUsers = await this.getAccessibleUsers(currentUser);

      if (hierarchyUsers.length === 0) {
        // AUDIT LOG FOR EMPTY RESULT
        await AuditService.createLog({
          action: "GET_ALL_KYC",
          entity: "UserKyc",
          performedByType: currentUser.role,
          performedById: currentUser.id,
          description: "Employee viewed KYC applications - No accessible users",
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

      // Mask PII data for employees
      const formattedKycs = kycs.map((kyc) => {
        const pii = [
          { type: "PAN", value: "XX-XXX-XXX-X" },
          { type: "AADHAAR", value: "XXXX-XXXX-XXXX" },
        ];

        return {
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
          documents: pii,
          location: {
            city: kyc.address?.city?.cityName || "-",
            state: kyc.address?.state?.stateName || "-",
            address: kyc.address?.address || "-",
            pinCode: kyc.address?.pinCode || "-",
          },
          status: kyc.status,
          type: kyc.type,
          createdAt: kyc.createdAt,
        };
      });

      // AUDIT LOG FOR GET ALL
      await AuditService.createLog({
        action: "GET_ALL_KYC",
        entity: "UserKyc",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Employee viewed KYC applications. Accessible users: ${hierarchyUsers.length}, Filters: status=${status}, search=${search}`,
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
        description: "Employee failed to get KYC applications",
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

      const employeeExists = await models.Employee.findByPk(currentUser.id);
      if (!employeeExists) throw ApiError.notFound("Employee not found");

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

      // Check if employee has access to this KYC
      const accessibleUsers = await this.getAccessibleUsers(currentUser);
      if (!accessibleUsers.includes(kyc.userId)) {
        // AUDIT LOG FOR UNAUTHORIZED ACCESS
        await AuditService.createLog({
          action: "GET_KYC_BY_ID",
          entity: "UserKyc",
          entityId: kycId,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          description: `Employee attempted to access unauthorized KYC: ${kycId}`,
          status: "FAILED",
          errorMessage: "Unauthorized access to KYC",
        });

        throw ApiError.forbidden(
          "You don't have permission to access this KYC"
        );
      }

      // Mask PII data for employees
      const piiData = kyc.piiConsents.map((pii) => {
        let maskedValue = "******";
        if (pii.piiType === "PAN") {
          maskedValue = "XX-XXX-XXX-X";
        } else if (pii.piiType === "AADHAAR") {
          maskedValue = "XXXX-XXXX-XXXX";
        }
        return {
          type: pii.piiType,
          value: maskedValue,
        };
      });

      // AUDIT LOG FOR GET BY ID
      await AuditService.createLog({
        action: "GET_KYC_BY_ID",
        entity: "UserKyc",
        entityId: kycId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Employee viewed KYC details for: ${kyc.firstName} ${kyc.lastName}`,
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
        description: "Employee failed to get KYC details",
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to get KYC: ${error.message}`);
    }
  }

  static async verifyKyc(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { id, status, kycRejectionReason } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const employeeExists = await models.Employee.findByPk(currentUser.id);
      if (!employeeExists) throw ApiError.notFound("Admin user not found");

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
          description: `Employee attempted to ${status === "VERIFIED" ? "verify" : "reject"} unauthorized KYC: ${id}`,
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
        description: `Employee ${status === "VERIFIED" ? "verified" : "rejected"} KYC for user: ${kyc.user.email}`,
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
        description: `Employee failed to ${payload.status === "VERIFIED" ? "verify" : "reject"} KYC`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to verify KYC: ${error.message}`);
    }
  }

  // Helper method to get users accessible by employee
  static async getAccessibleUsers(currentUser) {
    // If employee has a parent (admin), get that admin's hierarchy
    if (currentUser.parentId) {
      // Import AdminKycService dynamically to avoid circular dependency
      const { AdminKycService } = await import("../admin/adminKyc.service.js");
      return await AdminKycService.getHierarchyUsers(currentUser.parentId);
    }

    return [];
  }
}

export default EmployeeKycService;
