import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";
import AuditLogService from "./auditLog.service.js";

class SystemSettingService {
  static mapToSystemSetting(record) {
    return {
      userId: record.userId,
      companyName: record.companyName,
      companyLogo: record.companyLogo,
      favIcon: record.favIcon,
      phoneNumber: record.phoneNumber,
      whtsappNumber: record.whtsappNumber,
      companyEmail: record.companyEmail,
      facebookUrl: record.facebookUrl,
      instagramUrl: record.instagramUrl,
      twitterUrl: record.twitterUrl,
      linkedinUrl: record.linkedinUrl,
      websiteUrl: record.websiteUrl,
    };
  }
  static async upsert(data, userId, req = null, res = null) {
    const existing = await Prisma.systemSetting.findFirst({
      where: { userId },
    });

    let companyLogoUrl = existing?.companyLogo ?? null;
    let favIconUrl = existing?.favIcon ?? null;

    // Track file upload operations for audit
    const fileOperations = {
      companyLogo: { uploaded: false, deleted: false },
      favIcon: { uploaded: false, deleted: false },
    };

    try {
      if (data.companyLogo) {
        if (existing?.companyLogo) {
          await S3Service.delete({ fileUrl: existing.companyLogo });
          fileOperations.companyLogo.deleted = true;
        }
        companyLogoUrl = await S3Service.upload(
          data.companyLogo,
          "system-setting"
        );
        fileOperations.companyLogo.uploaded = true;
      }

      if (data.favIcon) {
        if (existing?.favIcon) {
          await S3Service.delete({ fileUrl: existing.favIcon });
          fileOperations.favIcon.deleted = true;
        }
        favIconUrl = await S3Service.upload(data.favIcon, "system-setting");
        fileOperations.favIcon.uploaded = true;
      }

      const payload = {
        userId,
        companyName: data.companyName || "",
        companyLogo: companyLogoUrl || "",
        favIcon: favIconUrl || "",
        phoneNumber: data.phoneNumber || "",
        whtsappNumber: data.whtsappNumber || "",
        companyEmail: data.companyEmail || "",
        facebookUrl: data.facebookUrl || "",
        instagramUrl: data.instagramUrl || "",
        twitterUrl: data.twitterUrl || "",
        linkedinUrl: data.linkedinUrl || "",
        websiteUrl: data.websiteUrl || "",
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      let result;
      let operationType = "";

      if (existing) {
        result = await Prisma.systemSetting.update({
          where: { id: existing.id },
          data: payload,
        });
        operationType = "UPDATED";
      } else {
        result = await Prisma.systemSetting.create({ data: payload });
        operationType = "CREATED";
      }

      // Track updated fields for audit
      const updatedFields = [];
      if (data.companyName !== undefined) updatedFields.push("companyName");
      if (data.phoneNumber !== undefined) updatedFields.push("phoneNumber");
      if (data.whtsappNumber !== undefined) updatedFields.push("whtsappNumber");
      if (data.companyEmail !== undefined) updatedFields.push("companyEmail");
      if (data.facebookUrl !== undefined) updatedFields.push("facebookUrl");
      if (data.instagramUrl !== undefined) updatedFields.push("instagramUrl");
      if (data.twitterUrl !== undefined) updatedFields.push("twitterUrl");
      if (data.linkedinUrl !== undefined) updatedFields.push("linkedinUrl");
      if (data.websiteUrl !== undefined) updatedFields.push("websiteUrl");
      if (data.companyLogo) updatedFields.push("companyLogo");
      if (data.favIcon) updatedFields.push("favIcon");

      // Create audit log for successful operation
      await AuditLogService.createAuditLog({
        userId: userId,
        action: `SYSTEM_SETTINGS_${operationType}`,
        entityType: "SYSTEM_SETTINGS",
        entityId: result.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          operation: operationType.toLowerCase(),
          updatedFields: updatedFields,
          roleName: req.user.role,
          fileOperations: fileOperations,
          companyName: data.companyName || existing?.companyName,
          updatedBy: userId,
        },
      });

      return this.mapToSystemSetting(result);
    } catch (error) {
      // Create audit log for failed operation
      await AuditLogService.createAuditLog({
        userId: userId,
        action: "SYSTEM_SETTINGS_UPSERT_FAILED",
        entityType: "SYSTEM_SETTINGS",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          error: error.message,
          operation: existing ? "update" : "create",
          roleName: req.user.role,
          fileOperations: fileOperations,
          updatedBy: userId,
        },
      });

      // Clean up uploaded files if operation failed
      if (fileOperations.companyLogo.uploaded && companyLogoUrl) {
        try {
          await S3Service.delete({ fileUrl: companyLogoUrl });
        } catch (cleanupError) {
          console.error(
            "Failed to clean up uploaded company logo:",
            cleanupError
          );
        }
      }

      if (fileOperations.favIcon.uploaded && favIconUrl) {
        try {
          await S3Service.delete({ fileUrl: favIconUrl });
        } catch (cleanupError) {
          console.error("Failed to clean up uploaded favicon:", cleanupError);
        }
      }

      throw error;
    }
  }

  static async getById(userId) {
    const setting = await Prisma.systemSetting.findFirst({ where: { userId } });
    if (!setting) return;

    const mapped = this.mapToSystemSetting(setting);
    return mapped;
  }

  static async getAll(page = 1, limit = 10, sort = "desc") {
    const skip = (page - 1) * limit;
    const dataRaw = await Prisma.systemSetting.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: sort },
    });

    const data = dataRaw.map(this.mapToSystemSetting);
    const total = await Prisma.systemSetting.count();

    const result = {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    return result;
  }

  static async delete(id) {
    const existing = await Prisma.systemSetting.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("System setting not found");

    if (existing.companyLogo)
      await S3Service.delete({ fileUrl: existing.companyLogo });
    if (existing.favIcon) await S3Service.delete({ fileUrl: existing.favIcon });

    const deleted = await Prisma.systemSetting.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.mapToSystemSetting(deleted);
  }
}

export default SystemSettingService;
