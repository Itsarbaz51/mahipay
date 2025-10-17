import Prisma from "../db/db.js";
import type {
  SystemSettingInput,
  SystemSetting,
} from "../types/systemSetting.types.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";

class SystemSettingService {
  private static mapToSystemSetting(record: any): SystemSetting {
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

  static async create(
    data: SystemSettingInput,
    userId: string
  ): Promise<SystemSetting> {
    try {
      // Check if system setting already exists
      const existing = await Prisma.systemSetting.findFirst({
        where: { userId },
      });
      if (existing) {
        throw ApiError.conflict("System setting already exists for this user");
      }

      // Upload files if provided
      const companyLogoUrl = data.companyLogo
        ? await S3Service.upload(data.companyLogo, "system-setting")
        : "";
      const favIconUrl = data.favIcon
        ? await S3Service.upload(data.favIcon, "system-setting")
        : "";

      const payload = {
        userId,
        companyName: data.companyName,
        companyLogo: companyLogoUrl as string,
        favIcon: favIconUrl as string,
        phoneNumber: data.phoneNumber,
        whtsappNumber: data.whtsappNumber,
        companyEmail: data.companyEmail,
        facebookUrl: data.facebookUrl || "",
        instagramUrl: data.instagramUrl || "",
        twitterUrl: data.twitterUrl || "",
        linkedinUrl: data.linkedinUrl || "",
        websiteUrl: data.websiteUrl || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const created = await Prisma.systemSetting.create({ data: payload });

      if (!created) throw ApiError.internal("Failed to create system setting");

      return this.mapToSystemSetting(created);
    } catch (error) {
      console.error("SystemSettingService.create failed:", error);
      throw error;
    } finally {
      const allFiles = [data.companyLogo, data.favIcon].filter(Boolean);
      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath as string);
      }
    }
  }

  static async update(
    id: string,
    data: Partial<SystemSettingInput>
  ): Promise<SystemSetting> {
    const existing = await Prisma.systemSetting.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("System setting not found");

    // Handle file uploads
    let companyLogoUrl = existing.companyLogo;
    let favIconUrl = existing.favIcon;

    if (data.companyLogo) {
      if (existing.companyLogo) {
        await S3Service.delete({ fileUrl: existing.companyLogo });
      }
      companyLogoUrl =
        (await S3Service.upload(data.companyLogo, "system-setting")) ??
        companyLogoUrl;
    }

    if (data.favIcon) {
      if (existing.favIcon) {
        await S3Service.delete({ fileUrl: existing.favIcon });
      }
      favIconUrl =
        (await S3Service.upload(data.favIcon, "system-setting")) ?? favIconUrl;
    }

    // Build payload – only include provided fields
    const payload: Partial<SystemSettingInput> & { updatedAt: Date } = {
      ...data,
      companyLogo: companyLogoUrl,
      favIcon: favIconUrl,
      updatedAt: new Date(),
    };

    const updated = await Prisma.systemSetting.update({
      where: { id },
      data: payload,
    });

    return this.mapToSystemSetting(updated);
  }

  static async getById(id: string): Promise<SystemSetting> {
    const setting = await Prisma.systemSetting.findUnique({ where: { id } });
    if (!setting) throw ApiError.notFound("System setting not found");
    return this.mapToSystemSetting(setting);
  }

  static async getAll(page = 1, limit = 10, sort: "asc" | "desc" = "desc") {
    const skip = (page - 1) * limit;
    const dataRaw = await Prisma.systemSetting.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: sort },
    });

    const data = dataRaw.map(this.mapToSystemSetting);
    const total = await Prisma.systemSetting.count();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async delete(id: string): Promise<SystemSetting> {
    const existing = await Prisma.systemSetting.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("System setting not found");

    // Delete files from S3
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
