import Prisma from "../db/db.js";
import type {
  SystemSettingInput,
  SystemSetting,
} from "../types/systemSetting.types.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import { clearPattern, getCacheWithPrefix, setCacheWithPrefix } from "../utils/redisCasheHelper.js";
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

  static async upsert(data: SystemSettingInput, userId: string): Promise<SystemSetting> {
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

    await clearPattern(`systemSetting:*:${userId}*`);
    await clearPattern(`systemSetting:getAll:*`);

    return this.mapToSystemSetting(result);
  }

  static async getById(userId: string): Promise<SystemSetting> {
    const cacheKey = `systemSetting:getById:${userId}`;
    const cached = await getCacheWithPrefix<SystemSetting>("systemSetting", `getById:${userId}`);
    if (cached) return cached;

    const setting = await Prisma.systemSetting.findFirst({ where: { userId } });
    if (!setting) throw ApiError.notFound("System setting not found");

    const mapped = this.mapToSystemSetting(setting);
    await setCacheWithPrefix("systemSetting", `getById:${userId}`, mapped, 300);
    return mapped;
  }

  static async getAll(page = 1, limit = 10, sort: "asc" | "desc" = "desc") {
    const cacheKey = `systemSetting:getAll:${page}:${limit}:${sort}`;
    const cached = await getCacheWithPrefix<any>("systemSetting", `getAll:${page}:${limit}:${sort}`);
    if (cached) return cached;

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

    await setCacheWithPrefix("systemSetting", `getAll:${page}:${limit}:${sort}`, result, 180);
    return result;
  }

  static async delete(id: string): Promise<SystemSetting> {
    const existing = await Prisma.systemSetting.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound("System setting not found");

    if (existing.companyLogo) await S3Service.delete({ fileUrl: existing.companyLogo });
    if (existing.favIcon) await S3Service.delete({ fileUrl: existing.favIcon });

    const deleted = await Prisma.systemSetting.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await clearPattern(`systemSetting:*:${existing.userId}*`);
    await clearPattern(`systemSetting:getAll:*`);

    return this.mapToSystemSetting(deleted);
  }
}

export default SystemSettingService;
