import Prisma from "../db/db.js";
import type {
  BankDetail,
  BankDetailInput,
  BankInput,
} from "../types/bank.types.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";

export class BankService {
  static async index(): Promise<BankInput[]> {
    const exists = await Prisma.banks.findMany({
      orderBy: { bankName: "asc" },
    });

    if (!exists) {
      throw ApiError.notFound("banks not found");
    }

    return exists;
  }

  static async show(id: string) {
    const bank = await Prisma.banks.findUnique({ where: { id } });
    if (!bank) throw ApiError.notFound("Bank not found");
    return bank;
  }

  static async store(data: BankInput & { bankIcon?: Express.Multer.File }) {
    try {
      const existsBank = await Prisma.banks.findFirst({
        where: { bankName: data.bankName, ifscCode: data.ifscCode },
      });
      if (existsBank) {
        throw ApiError.conflict("Bank with this IFSC already exists");
      }

      if (!data.bankIcon) {
        throw ApiError.badRequest("Bank icon is required");
      }

      let bankIconUrl;

      try {
        bankIconUrl = await S3Service.upload(data.bankIcon, "bank-icon");
        if (!bankIconUrl) throw new Error("Upload returned empty URL");
      } catch (err) {
        console.error("Bank icon upload failed:", err);
        throw ApiError.internal("Failed to upload bank icon");
      }

      const createdBank = await Prisma.banks.create({
        data: {
          bankName: data.bankName,
          ifscCode: data.ifscCode,
          bankIcon: bankIconUrl,
        },
      });

      return createdBank;
    } finally {
      if (data.bankIcon?.path) {
        await Helper.deleteOldImage(data.bankIcon.path);
      }
    }
  }

  static async update(
    id: string,
    data: Partial<BankInput> & { bankIcon?: Express.Multer.File }
  ) {
    const bank = await Prisma.banks.findUnique({ where: { id } });
    if (!bank) throw ApiError.notFound("Bank not found");

    const linkedBankDetails = await Prisma.bankDetail.count({
      where: { bankId: id },
    });
    if (linkedBankDetails > 0) {
      throw ApiError.forbidden(
        "Cannot update this bank because it is linked in bankDetail"
      );
    }

    const duplicateBank = await Prisma.banks.findFirst({
      where: {
        bankName: data.bankName ?? bank.bankName,
        ifscCode: data.ifscCode ?? bank.ifscCode,
        NOT: { id },
      },
    });
    if (duplicateBank) {
      throw ApiError.conflict("Bank with this name and IFSC already exists");
    }

    let bankIconUrl;
    if (data.bankIcon) {
      try {
        bankIconUrl = await S3Service.upload(data.bankIcon.path, "bank-icon");

        if (bank.bankIcon) {
          await S3Service.delete({ fileUrl: bank.bankIcon });
        }
      } catch (err) {
        console.warn("Bank icon upload failed:", err);
      } finally {
        if (data.bankIcon.path) await Helper.deleteOldImage(data.bankIcon.path);
      }
    }

    const updatedBank = await Prisma.banks.update({
      where: { id },
      data: {
        bankName: data.bankName ?? bank.bankName,
        ifscCode: data.ifscCode ?? bank.ifscCode,
        bankIcon: bankIconUrl as string,
      },
    });

    return updatedBank;
  }

  static async destroy(id: string) {
    const bank = await Prisma.banks.findUnique({ where: { id } });
    if (!bank) throw ApiError.notFound("Bank not found");

    const linkedBankDetails = await Prisma.bankDetail.count({
      where: { bankId: id },
    });
    if (linkedBankDetails > 0) {
      throw ApiError.forbidden(
        "Cannot delete this bank because it is linked in bankDetail"
      );
    }

    if (bank.bankIcon) {
      try {
        await S3Service.delete({ fileUrl: bank.bankIcon });
      } catch (err) {
        console.warn("Failed to delete bank icon from S3:", err);
      }
    }

    const deletedBank = await Prisma.banks.delete({ where: { id } });

    if (!deletedBank) {
      throw ApiError.internal("Failed to delete Bank");
    }

    return deletedBank;
  }
}

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
      include: { bank: true, user: true },
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
      include: { bank: true, user: true },
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
