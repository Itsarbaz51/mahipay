import Prisma from "../db/db.js";
import type {
  BankDetail,
  BankDetailInput,
} from "../types/bank.types.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";


// ================= USER BANK DETAILS =================

export class BankDetailService {
  static async index(params: {
    userId: string;
    isVerified?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
  }): Promise<any> {
    const { userId, isVerified, page = 1, limit = 10, sort = "desc" } = params;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const sortOrder = sort === "asc" ? "asc" : "desc";

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, children: { select: { id: true } } },
    });

    if (!user) throw ApiError.notFound("User not found");

    const roleName = user.role.name.toUpperCase();

    let where: any = {};

    if (["ADMIN", "SUPER ADMIN"].includes(roleName)) {
      const childUserIds = user.children.map((child) => child.id);
      if (childUserIds.length === 0) {
        return {
          data: [],
          meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
        };
      }
      where.userId = { in: childUserIds };
    } else {
      where.userId = userId;
    }

    if (typeof isVerified === "boolean") {
      where.isVerified = isVerified;
    }

    const skip = (pageNum - 1) * limitNum;

    const banks = await Prisma.bankDetail.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sortOrder },
      include: { user: true },
    });

    const total = await Prisma.bankDetail.count({ where });

    return {
      data: banks,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  static async show(id: string, userId: string): Promise<BankDetail> {
    const record = await Prisma.bankDetail.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!record) throw ApiError.notFound("Bank detail not found");

    if (record.userId !== userId)
      throw ApiError.forbidden("Unauthorized access");

    const safely = await Helper.serializeUser(record);
    return safely;
  }

  static async store(payload: BankDetailInput): Promise<BankDetail> {
    const { bankProofFile, ...rest } = payload;
    let proofUrl;

    try {
      const exists = await Prisma.bankDetail.findFirst({
        where: { accountNumber: rest.accountNumber },
      });

      if (exists) {
        throw ApiError.conflict("This account number already exsits");
      }

      if (bankProofFile) {
        proofUrl = await S3Service.upload(bankProofFile.path, "bankdoc");
      }

      if (!proofUrl) throw ApiError.internal("Proof upload failed");

      if (payload.isPrimary) {
        await Prisma.bankDetail.updateMany({
          where: { userId: payload.userId },
          data: { isPrimary: false },
        });
      }

      const createBank = await Prisma.bankDetail.create({
        data: {
          ...rest,
          bankProofFile: proofUrl,
        },
      });

      if (!createBank) throw ApiError.internal("Failed to create bank details");

      return createBank;
    } catch (error) {
      console.error("storeBankDetail failed:", error);
      throw error;
    } finally {
      if (bankProofFile?.path) {
        await Helper.deleteOldImage(bankProofFile.path);
      }
    }
  }

  static async update(
    id: string,
    userId: string,
    payload: Partial<BankDetailInput>
  ): Promise<BankDetail> {
    try {
      const record = await Prisma.bankDetail.findUnique({ where: { id } });

      if (!record || record.userId !== userId) {
        throw ApiError.forbidden("Unauthorized access");
      }

      const bankExsits = await Prisma.bankDetail.findFirst({
        where: {
          id,
        },
      });

      if (!bankExsits) {
        throw ApiError.notFound("Bank not found");
      }

      let proofUrl;

      if (payload.bankProofFile) {
        if (proofUrl) {
          await S3Service.delete({ fileUrl: proofUrl });
        }

        proofUrl = await S3Service.upload(
          payload.bankProofFile.path,
          "bankdoc"
        );
      }

      if (payload.isPrimary) {
        await Prisma.bankDetail.updateMany({
          where: { userId },
          data: { isPrimary: false },
        });
      }

      const updateBank = await Prisma.bankDetail.update({
        where: { id },
        data: {
          ...payload,
          bankProofFile: proofUrl as string,
        },
      });

      if (!updateBank) throw ApiError.internal("Failed to update bank details");

      return updateBank;
    } catch (error) {
      console.error("storeBusinessKyc failed:", error);
      throw error;
    } finally {
      const allFiles = [payload.bankProofFile?.path].filter(Boolean);

      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath as string);
      }
    }
  }

  static async destroy(id: string, userId: string): Promise<BankDetail> {
    const record = await Prisma.bankDetail.findUnique({ where: { id } });

    if (!record || record.userId !== userId)
      throw ApiError.forbidden("Unauthorized access");

    const deleteBank = await Prisma.bankDetail.delete({ where: { id } });

    if (!deleteBank) throw ApiError.internal("Failed to delete bank");

    return deleteBank;
  }
}
