import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

export class EmployeeBusinessKycService {
  static async getAllBusinessKyc(currentUser, options = {}) {
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
          action: "GET_ALL_BUSINESS_KYC",
          entity: "BusinessKyc",
          performedByType: currentUser.role,
          performedById: currentUser.id,
          description:
            "Employee viewed Business KYC applications - No accessible users",
          status: "SUCCESS",
        });

        return {
          businessKycs: [],
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
          { businessName: { [Op.iLike]: `%${search}%` } },
          { "$user.email$": { [Op.iLike]: `%${search}%` } },
          { "$user.phoneNumber$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows: businessKycs } =
        await models.BusinessKyc.findAndCountAll({
          where: whereCondition,
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
      const formattedBusinessKycs = businessKycs.map((businessKyc) => {
        const pii = [
          { type: "PAN", value: "XX-XXX-XXX-X" },
          { type: "GST", value: "XXXXXXXXXXXXXXX" },
        ];

        return {
          id: businessKyc.id,
          profile: {
            businessName: businessKyc.businessName,
            businessType: businessKyc.businessType,
            userId: businessKyc.userId,
            userName: `${businessKyc.user.firstName} ${businessKyc.user.lastName}`,
            email: businessKyc.user.email,
            phone: businessKyc.user.phoneNumber,
            username: businessKyc.user.username,
          },
          parent: {
            username: businessKyc.user.parent?.username || "N/A",
            name: businessKyc.user.parent
              ? `${businessKyc.user.parent.firstName} ${businessKyc.user.parent.lastName}`
              : "N/A",
          },
          documents: pii,
          location: {
            city: businessKyc.address?.city?.cityName || "-",
            state: businessKyc.address?.state?.stateName || "-",
            address: businessKyc.address?.address || "-",
            pinCode: businessKyc.address?.pinCode || "-",
          },
          status: businessKyc.status,
          createdAt: businessKyc.createdAt,
        };
      });

      // AUDIT LOG FOR GET ALL
      await AuditService.createLog({
        action: "GET_ALL_BUSINESS_KYC",
        entity: "BusinessKyc",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Employee viewed Business KYC applications. Accessible users: ${hierarchyUsers.length}, Filters: status=${status}, search=${search}`,
        status: "SUCCESS",
      });

      return {
        businessKycs: formattedBusinessKycs,
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
        action: "GET_ALL_BUSINESS_KYC",
        entity: "BusinessKyc",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Employee failed to get Business KYC applications",
        status: "FAILED",
        errorMessage: error.message,
      });

      throw ApiError.internal(
        `Failed to get Business KYC applications: ${error.message}`
      );
    }
  }

  static async getBusinessKycById(businessKycId, currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const employeeExists = await models.Employee.findByPk(currentUser.id);
      if (!employeeExists) throw ApiError.notFound("Employee not found");

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

      // Check if employee has access to this Business KYC
      const accessibleUsers = await this.getAccessibleUsers(currentUser);
      if (!accessibleUsers.includes(businessKyc.userId)) {
        // AUDIT LOG FOR UNAUTHORIZED ACCESS
        await AuditService.createLog({
          action: "GET_BUSINESS_KYC_BY_ID",
          entity: "BusinessKyc",
          entityId: businessKycId,
          performedByType: currentUser.role,
          performedById: currentUser.id,
          description: `Employee attempted to access unauthorized Business KYC: ${businessKycId}`,
          status: "FAILED",
          errorMessage: "Unauthorized access to Business KYC",
        });

        throw ApiError.forbidden(
          "You don't have permission to access this Business KYC"
        );
      }

      // Mask PII data for employees
      const piiData = businessKyc.piiConsents.map((pii) => {
        let maskedValue = "******";
        if (pii.piiType === "PAN") {
          maskedValue = "XX-XXX-XXX-X";
        } else if (pii.piiType === "GST") {
          maskedValue = "XXXXXXXXXXXXXXX";
        }
        return {
          type: pii.piiType,
          value: maskedValue,
        };
      });

      // AUDIT LOG FOR GET BY ID
      await AuditService.createLog({
        action: "GET_BUSINESS_KYC_BY_ID",
        entity: "BusinessKyc",
        entityId: businessKycId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Employee viewed Business KYC details for: ${businessKyc.businessName}`,
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
        description: "Employee failed to get Business KYC details",
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to get Business KYC: ${error.message}`);
    }
  }

  static async verifyBusinessKyc(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { id, status, rejectionReason } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const roleExists = await models.Role.findOne({
        where: { id: currentUser.id },
      });

      if (!roleExists) throw ApiError.notFound("Role user not found");

      const businessKyc = await models.BusinessKyc.findByPk(id, {
        include: [
          {
            model: models.User,
            as: "user",
            attributes: ["id", "email"],
          },
        ],
        transaction,
      });

      if (!businessKyc) {
        throw ApiError.notFound("Business KYC application not found");
      }

      const oldStatus = businessKyc.status;

      // Update Business KYC status
      await businessKyc.update(
        {
          status,
          rejectionReason: status === "REJECTED" ? rejectionReason : null,
          verifiedByRootId: currentUser.id,
          verifiedAt: new Date(),
          rootId: currentUser.id,
        },
        { transaction }
      );

      // Update user's business verification status if needed
      // You might want to add a field like isBusinessVerified to User model
      // await models.User.update(
      //   {
      //     isBusinessVerified: status === "VERIFIED",
      //   },
      //   {
      //     where: { id: businessKyc.userId },
      //     transaction,
      //   }
      // );

      // AUDIT LOG FOR VERIFICATION
      await AuditService.createLog({
        action:
          status === "VERIFIED" ? "VERIFY_BUSINESS_KYC" : "REJECT_BUSINESS_KYC",
        entity: "BusinessKyc",
        entityId: id,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues: { status: oldStatus },
        newValues: {
          status,
          ...(status === "REJECTED" && { rejectionReason }),
        },
        description: `Root user ${status === "VERIFIED" ? "verified" : "rejected"} Business KYC for: ${businessKyc.businessName}`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return businessKyc;
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED VERIFICATION
      await AuditService.createLog({
        action:
          payload.status === "VERIFIED"
            ? "VERIFY_BUSINESS_KYC"
            : "REJECT_BUSINESS_KYC",
        entity: "BusinessKyc",
        entityId: payload.id,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Root user failed to ${payload.status === "VERIFIED" ? "verify" : "reject"} Business KYC`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(
        `Failed to verify Business KYC: ${error.message}`
      );
    }
  }

  // Helper method to get users accessible by employee
  static async getAccessibleUsers(currentUser) {
    // If employee has a parent (admin), get that admin's hierarchy
    if (currentUser.parentId) {
      // Import AdminBusinessKycService dynamically to avoid circular dependency
      const { AdminBusinessKycService } = await import(
        "../admin/adminBusinessKyc.service.js"
      );
      return await AdminBusinessKycService.getHierarchyUsers(
        currentUser.parentId
      );
    }

    return [];
  }
}

export default EmployeeBusinessKycService;
