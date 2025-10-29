import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";

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

  static async upsert(data, userId) {
    const existing = await Prisma.systemSetting.findFirst({ where: { userId } });

    let companyLogoUrl = existing?.companyLogo ?? null;
    let favIconUrl = existing?.favIcon ?? null;

    if (data.companyLogo) {
      if (existing?.companyLogo) await S3Service.delete({ fileUrl: existing.companyLogo });
      companyLogoUrl = await S3Service.upload(data.companyLogo, "system-setting");
    }

    if (data.favIcon) {
      if (existing?.favIcon) await S3Service.delete({ fileUrl: existing.favIcon });
      favIconUrl = await S3Service.upload(data.favIcon, "system-setting");
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
    if (existing) {
      result = await Prisma.systemSetting.update({ where: { id: existing.id }, data: payload });
    } else {
      result = await Prisma.systemSetting.create({ data: payload });
    }

    return this.mapToSystemSetting(result);
  }

  static async getById(userId) {
    const setting = await Prisma.systemSetting.findFirst({ where: { userId } });
    if (!setting) throw ApiError.notFound("System setting not found");

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

    if (existing.companyLogo) await S3Service.delete({ fileUrl: existing.companyLogo });
    if (existing.favIcon) await S3Service.delete({ fileUrl: existing.favIcon });

    const deleted = await Prisma.systemSetting.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.mapToSystemSetting(deleted);
  }
}

export default SystemSettingService;