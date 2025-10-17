import Prisma from "../db/db.js";
import { KycStatus as PrismaKycStatus } from "@prisma/client";

import type {
  UserKyc,
  Gender,
  UserKycUploadInput,
  KycVerificationInput,
  FilterParams,
} from "../types/kyc.types.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";
import Helper from "../utils/helper.js";

class KycServices {
  // users kyc
  static async indexUserKyc(params: FilterParams) {
    const {
      userId,
      status = "ALL",
      page = 1,
      limit = 10,
      sort = "desc",
    } = params;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const sortOrder = sort === "asc" ? "asc" : "desc";

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        children: { select: { id: true } },
      },
    });

    if (!user) throw ApiError.notFound("User not found");
    if (!["ADMIN", "SUPER ADMIN"].includes(user.role.name.toUpperCase()))
      throw ApiError.forbidden("Access denied: insufficient permissions");

    const childUserIds = user.children.map((child) => child.id);
    if (childUserIds.length === 0)
      return {
        data: [],
        meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
      };

    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: { in: childUserIds } };
    if (status && status.toUpperCase() !== "ALL") {
      where.status = status.toUpperCase(); // Only VERIFIED|REJECTED|PENDING
    }

    const kycs = await Prisma.userKyc.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sortOrder },
      include: { user: true, address: true },
    });

    const total = await Prisma.userKyc.count({ where });

    return {
      data: kycs,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  static async showUserKyc(userId: string, id: string): Promise<UserKyc> {
    const userExsits = await Prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!userExsits) {
      throw ApiError.notFound("User not found");
    }

    const kyc = await Prisma.userKyc.findFirst({
      where: { id, userId: userExsits.id },
    });

    if (!kyc) {
      throw ApiError.notFound("KYC not found");
    }

    return {
      ...kyc,
      gender: kyc.gender as Gender,
    };
  }

  static async storeUserKyc(payload: UserKycUploadInput): Promise<UserKyc> {
    try {
      const userExists = await Prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true },
      });

      if (!userExists) {
        throw ApiError.notFound("User not found");
      }

      const existingKyc = await Prisma.userKyc.findFirst({
        where: { userId: payload.userId },
      });

      if (existingKyc) {
        throw ApiError.conflict("KYC already exists for this user");
      }

      const addressExists = await Prisma.address.findUnique({
        where: { id: payload.addressId },
        select: { id: true },
      });

      if (!addressExists) {
        throw ApiError.notFound("Address not found");
      }

      // Upload files
      const panUrl = await S3Service.upload(payload.panFile.path, "user-kyc");
      const photoUrl = await S3Service.upload(payload.photo.path, "user-kyc");
      const aadhaarUrl = await S3Service.upload(
        payload.aadhaarFile.path,
        "user-kyc"
      );
      const addressProofUrl = await S3Service.upload(
        payload.addressProofFile.path,
        "user-kyc"
      );

      if (!panUrl || !photoUrl || !aadhaarUrl || !addressProofUrl) {
        throw ApiError.internal("Failed to upload one or more KYC documents");
      }

      const createdKyc = await Prisma.userKyc.create({
        data: {
          userId: payload.userId,
          firstName: payload.firstName.trim(),
          lastName: payload.lastName.trim(),
          fatherName: payload.fatherName.trim(),
          dob: new Date(payload.dob),
          gender: payload.gender,
          addressId: addressExists.id,
          panFile: panUrl,
          aadhaarFile: aadhaarUrl,
          addressProofFile: addressProofUrl,
          photo: photoUrl,
        },
      });

      if (!createdKyc) {
        throw ApiError.internal("Failed to create user kyc");
      }

      // Create PII consents
      const createdPii = await Prisma.piiConsent.createMany({
        data: [
          {
            userId: payload.userId,
            userKycId: createdKyc.id,
            piiType: "PAN",
            piiHash: Helper.hashData(payload.panNumber),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5), // 1 year
            scope: "KYC_VERIFICATION",
          },
          {
            userId: payload.userId,
            userKycId: createdKyc.id,
            piiType: "AADHAAR",
            piiHash: Helper.hashData(payload.aadhaarNumber),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 5),
            scope: "KYC_VERIFICATION",
          },
        ],
      });

      if (!createdPii) {
        throw ApiError.internal("Failed to create user kyc Pii");
      }

      return {
        ...createdKyc,
        gender: createdKyc.gender as Gender,
      };
    } catch (error) {
      console.error("storeBusinessKyc failed:", error);
      throw error;
    } finally {
      const allFiles = [
        payload.panFile?.path,
        payload.photo?.path,
        payload.aadhaarFile?.path,
        payload.addressProofFile?.path,
      ].filter(Boolean);

      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath as string);
      }
    }
  }

  static async updateUserKyc(
    id: string,
    payload: Partial<UserKycUploadInput>
  ): Promise<UserKyc> {
    try {
      const existingKyc = await Prisma.userKyc.findUnique({ where: { id } });
      if (!existingKyc) throw ApiError.notFound("User KYC not found");

      const updates: any = {};

      if (payload.firstName) updates.firstName = payload.firstName.trim();
      if (payload.lastName) updates.lastName = payload.lastName.trim();
      if (payload.fatherName) updates.fatherName = payload.fatherName.trim();
      if (payload.gender) updates.gender = payload.gender;
      if (payload.dob) updates.dob = new Date(payload.dob);

      const uploadTasks: Promise<string | null>[] = [];
      const fileFields: [keyof typeof payload, keyof typeof existingKyc][] = [
        ["panFile", "panFile"],
        ["photo", "photo"],
        ["aadhaarFile", "aadhaarFile"],
        ["addressProofFile", "addressProofFile"],
      ];

      for (const [fileField, dbField] of fileFields) {
        const file = payload[fileField] as any; // safely cast
        if (file && typeof file === "object" && "path" in file) {
          uploadTasks.push(
            (async () => {
              const newUrl = await S3Service.upload(
                (file as any).path,
                "user-kyc"
              );
              if (newUrl) {
                const oldUrl = existingKyc[dbField] as string | null;
                if (oldUrl) {
                  await S3Service.delete({ fileUrl: oldUrl });
                }
                updates[dbField] = newUrl;
              }
              return newUrl;
            })()
          );
        }
      }

      if (uploadTasks.length > 0) await Promise.all(uploadTasks);

      const updatedKyc = await Prisma.userKyc.update({
        where: { id },
        data: updates,
      });

      if (!updatedKyc) {
        throw ApiError.internal("Failed to update user kyc");
      }

      return {
        ...updatedKyc,
        gender: updatedKyc.gender as Gender,
      };
    } catch (error) {
      console.error("storeBusinessKyc failed:", error);
      throw error;
    } finally {
      const allFiles = [
        payload.panFile?.path,
        payload.photo?.path,
        payload.aadhaarFile?.path,
        payload.addressProofFile?.path,
      ].filter(Boolean);

      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath as string);
      }
    }
  }

  static async verifyUserKyc(payload: KycVerificationInput): Promise<UserKyc> {
    const existingKyc = await Prisma.userKyc.findFirst({
      where: { id: payload.id },
    });

    if (!existingKyc) {
      throw ApiError.notFound("KYC not found");
    }

    const enumStatus =
      PrismaKycStatus[payload.status as keyof typeof PrismaKycStatus];
    if (!enumStatus) {
      throw ApiError.badRequest("Invalid status value");
    }

    const updateVerify = await Prisma.userKyc.update({
      where: { id: existingKyc.id },
      data: {
        status: { set: enumStatus },
      },
    });

    if (!updateVerify) throw ApiError.internal("Failed to verifyed user kyc");

    return { ...updateVerify, gender: updateVerify.gender as Gender };
  }
}

export default KycServices;
