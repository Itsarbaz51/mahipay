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
    sort?: "asc" | "desc";
  }): Promise<any> {
    const { userId, isVerified, page = 1, limit = 10, sort = "desc" } = params;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const sortOrder = sort === "asc" ? "asc" : "desc";

    // Fetch user and their direct children
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: { children: { select: { id: true } } },
    });

    if (!user) throw ApiError.notFound("User not found");

    const selfWhere: any = { userId: userId };
    const childUserIds = user.children?.map((child) => child.id) || [];
    const childWhere: any = { userId: { in: childUserIds } };

    if (typeof isVerified === "boolean") {
      selfWhere.isVerified = isVerified;
      childWhere.isVerified = isVerified;
    }

    const skip = (pageNum - 1) * limitNum;

    // Fetch self banks
    const selfBanks = await Prisma.bankDetail.findMany({
      where: selfWhere,
      skip,
      take: limitNum,
      orderBy: { createdAt: sortOrder },
      include: { user: true },
    });

    const selfTotal = await Prisma.bankDetail.count({ where: selfWhere });

    // Fetch child banks (only if children exist)
    let childBanks: any[] = [];
    let childTotal = 0;
    if (childUserIds.length > 0) {
      childBanks = await Prisma.bankDetail.findMany({
        where: childWhere,
        skip,
        take: limitNum,
        orderBy: { createdAt: sortOrder },
        include: { user: true },
      });
      childTotal = await Prisma.bankDetail.count({ where: childWhere });
    }

    return {
      message: "Bank details fetched successfully",
      data: {
        selfBanks: {
          data: selfBanks,
          meta: {
            page: pageNum,
            limit: limitNum,
            total: selfTotal,
            totalPages: Math.ceil(selfTotal / limitNum),
          },
        },
        childBanks: {
          data: childBanks,
          meta: {
            page: pageNum,
            limit: limitNum,
            total: childTotal,
            totalPages: Math.ceil(childTotal / limitNum),
          },
        },
      },
      statusCode: 200,
    };
  }

  static async getAllMy(userId: string): Promise<BankDetail[]> {

    const records = await Prisma.bankDetail.findMany({
      where: { userId }
    });

    if (!records) throw ApiError.notFound("No bank details found");

    const safely = await Helper.serializeUser(records);
    return safely;
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
    console.log(payload);


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

      console.log("bnbbbbbbbbbbbbbbbbbbbbb", proofUrl);


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
