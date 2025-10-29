import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";


export class BankDetailService {
  // ================= BANK DETAILS =================
  static async getAllChildrenIds(userId) {

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        children: {
          select: { id: true, children: { select: { id: true } } }
        }
      },
    });

    if (!user || !user.children?.length) return [];

    let allChildIds = [];

    // Recursively get all descendants
    const getDescendants = async (parentId)=> {
      const children = await Prisma.user.findMany({
        where: { parentId },
        select: { id: true }
      });

      if (!children.length) return [];

      const childIds = children.map(child => child.id);
      let descendantIds = [...childIds];

      // Get grandchildren recursively
      for (const childId of childIds) {
        const grandchildren = await getDescendants(childId);
        descendantIds.push(...grandchildren);
      }

      return descendantIds;
    };

    allChildIds = await getDescendants(userId);
    return allChildIds;
  }

  static async index(params) {
    const { userId, role, status, page = 1, limit = 10, sort = "desc", search } = params;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = sort === "asc" ? "asc" : "desc";

    let where = {};

    if (role === "ADMIN") {
      where.userId = { not: userId };
      where.user = {
        role: { is: { name: { not: "ADMIN" } } }
      };
    } else {
      const childIds = await this.getAllChildrenIds(userId);
      if (!childIds.length) {
        return {
          banks: [],
          meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
        };
      }
      where.userId = { in: childIds };
    }

    if (status && status !== "ALL") where.status = status;
    if (search && search.trim() !== "") {
      const searchTerm = search.trim();
      where.OR = [
        { accountNumber: { contains: searchTerm } },
        { bankName: { contains: searchTerm } },
      ];
    }

    const banks = await Prisma.bankDetail.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sortOrder },
      include: {
        user: { include: { role: true } }
      },
    });

    const total = await Prisma.bankDetail.count({ where });

    const result = {
      banks,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    return result;
  }

  static async getAllMy(userId ) {
    const records = await Prisma.bankDetail.findMany({
      where: { userId }
    });

    if (!records) throw ApiError.notFound("No bank details found");

    const safely = await Helper.serializeUser(records);
    return safely;
  }

  static async show(id, userId){

    const record = await Prisma.bankDetail.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!record) throw ApiError.notFound("Bank detail not found");

    const safely = await Helper.serializeUser(record);
    return safely;
  }

  static async store(payload) {
    const { bankProofFile, ...rest } = payload;
    let proofUrl;
    try {

      const userExsits = await Prisma.user.findUnique({
        where: { id: payload.userId },
        select: { role: true },
      });

      if (!userExsits) {
        throw ApiError.notFound("User not found");
      }

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

      let status = "PENDING";

      if (userExsits.role.name === "ADMIN") {
        status = "VERIFIED";
      } else {
        const user = await Prisma.user.findUnique({
          where: { id: payload.userId },
          select: { role: true },
        });
        if (userExsits?.role.name === "ADMIN") {
          status = "VERIFIED";
        }
      }

      const createBank = await Prisma.bankDetail.create({
        data: {
          ...rest,
          bankProofFile: proofUrl,
          status,
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
    id ,
    userId ,
    payload
  ) {
    try {
      // Fetch existing record
      const record = await Prisma.bankDetail.findUnique({ where: { id } });

      if (!record || record.userId !== userId) {
        throw ApiError.forbidden("Unauthorized access");
      }

      // If record doesn't exist
      if (!record) {
        throw ApiError.notFound("Bank not found");
      }

      let proofUrl;

      // Upload new proof if provided
      if (payload.bankProofFile) {
        if (record.bankProofFile) {
          await S3Service.delete({ fileUrl: record.bankProofFile });
        }

        proofUrl = await S3Service.upload(payload.bankProofFile.path, "bankdoc");
      }

      // If isPrimary = true, make others false
      if (payload.isPrimary) {
        await Prisma.bankDetail.updateMany({
          where: { userId },
          data: { isPrimary: false },
        });
      }


      let newStatus = record.status;
      let newRejectionReason = record.bankRejectionReason;

      if (record.status === "REJECT" || record.status === "VERIFIED") {
        newStatus = "PENDING";
      }

      if (record.status === "REJECT") {
        newRejectionReason = null;
      }

      const updateBank = await Prisma.bankDetail.update({
        where: { id },
        data: {
          ...payload,
          bankProofFile: proofUrl || record.bankProofFile,
          status: newStatus,
          bankRejectionReason: newRejectionReason,
        },
      });


      if (!updateBank) throw ApiError.internal("Failed to update bank details");


      return updateBank;
    } catch (error) {
      console.error("update bank failed:", error);
      throw error;
    } finally {
      // Clean up temporary files
      const allFiles = [payload.bankProofFile?.path].filter(Boolean);
      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath );
      }
    }
  }

  static async destroy(id, userId ) {
    const record = await Prisma.bankDetail.findUnique({ where: { id } });

    if (!record || record.userId !== userId)
      throw ApiError.forbidden("Unauthorized access");

    const deleteBank = await Prisma.bankDetail.delete({ where: { id } });

    if (!deleteBank) throw ApiError.internal("Failed to delete bank");

    return deleteBank;
  }

  // ================= BANK Admin manage =================
  static async verification(
    id,
    userId ,
    payload
  ) {
    if (!id) throw ApiError.badRequest("Bank ID is required");

    const record = await Prisma.bankDetail.findUnique({ where: { id } });
    if (!record) throw ApiError.notFound("Bank record not found");

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAdmin = user?.role?.name === "ADMIN";

    if (!isAdmin && record.userId !== userId) {
      throw ApiError.forbidden("Unauthorized access");
    }

    const updatedBank = await Prisma.bankDetail.update({
      where: { id },
      data: {
        status: payload.status ?? record.status,
        bankRejectionReason: payload.bankRejectionReason ?? record.bankRejectionReason ?? "",
      },
    });
    return updatedBank;
  }
}
