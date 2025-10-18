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
import { CryptoService } from "../utils/cryptoService.js";

class KycServices {
  // users kyc
  static async indexUserKyc(params: FilterParams) {
    const {
      userId,
      status = "ALL",
      page = 1,
      limit = 10,
      sort = "desc",
      search,
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

    const where: any = {
      userId: { in: childUserIds },
      ...(status &&
        status.toUpperCase() !== "ALL" && { status: status.toUpperCase() }),
      ...(search && {
        user: {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { phoneNumber: { contains: search } },
          ],
        },
      }),
    };

    const kycs = await Prisma.userKyc.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sortOrder },
      include: {
        user: true,
        address: {
          select: {
            address: true,
            pinCode: true,
            city: true,
            state: true,
          },
        },
        piiConsents: true,
      },
    });

    const total = await Prisma.userKyc.count({ where });

    // --- Map to frontend-friendly data
    const frontendData = kycs.map((kyc) => {
      // Mask PII
      const pii = kyc.piiConsents.map((p) => {
        let piiDisplay = "";
        if (p.piiType === "PAN") {
          piiDisplay = p.piiHash.slice(0, 2) + "XXX" + p.piiHash.slice(-3);
        } else if (p.piiType === "AADHAAR") {
          piiDisplay = "XXXX-XXXX-" + p.piiHash.slice(-4);
        } else {
          piiDisplay = "******";
        }
        return { type: p.piiType, value: piiDisplay };
      });

      return {
        id: kyc.id,
        profile: {
          name: `${kyc.user.firstName} ${kyc.user.lastName}`,
          userId: kyc.userId,
          email: kyc.user.email,
          phone: kyc.user.phoneNumber,
          photo: kyc.photo || null,
        },
        documents: pii,
        location: {
          city: kyc.address?.city?.cityName || "-",
          state: kyc.address?.state?.stateName || "-",
          address: kyc.address?.address || "-",
          pinCode: kyc.address?.pinCode || "-",
        },
        status: kyc.status,
        createdAt: kyc.createdAt,
      };
    });

    return {
      data: frontendData,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  static async showUserKyc(
    id?: string,
    userId?: string,
    requestingUser?: { id: string; role: string }
  ) {
    if (!id && !userId) {
      throw ApiError.badRequest("Either KYC ID or User ID is required");
    }

    const whereClause: any = {};
    if (id && id !== "undefined") {
      whereClause.id = id;
    } else if (userId) {
      whereClause.userId = userId;
    }

    const kyc = await Prisma.userKyc.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        address: {
          select: {
            address: true,
            pinCode: true,
            city: { select: { cityName: true } },
            state: { select: { stateName: true } },
          },
        },
        piiConsents: {
          select: {
            piiType: true,
            piiHash: true,
          },
        },
      },
    });

    if (!kyc) {
      throw ApiError.notFound("KYC not found");
    }

    // Type assertion for included relations
    const kycWithRelations = kyc as any;

    // Check permissions
    const isOwner = requestingUser && kyc.userId === requestingUser.id;
    const isAdmin = requestingUser && requestingUser.role === "ADMIN";

    const pii = await Promise.all(
      kycWithRelations.piiConsents.map(async (p: any) => {
        try {
          // ✅ Decrypt the encrypted data using CryptoService
          const decryptedValue = await CryptoService.decrypt(p.piiHash);

          if (isAdmin || isOwner) {
            // Show decrypted values to admin and owner
            if (p.piiType === "AADHAAR" && decryptedValue.length === 12) {
              const formattedAadhaar = `${decryptedValue.slice(0, 4)}-${decryptedValue.slice(4, 8)}-${decryptedValue.slice(8)}`;
              return { type: p.piiType, value: formattedAadhaar };
            }
            return { type: p.piiType, value: decryptedValue };
          } else {
            // Mask the PII data for non-admin/non-owner
            let masked = "******";
            if (p.piiType === "PAN") {
              masked = `${decryptedValue.slice(0, 2)}XXXX${decryptedValue.slice(-3)}`;
            } else if (p.piiType === "AADHAAR") {
              masked = `${decryptedValue.slice(0, 2)}XX-XXXX-${decryptedValue.slice(-4)}`;
            }
            return { type: p.piiType, value: masked };
          }
        } catch (error) {
          console.error(`Failed to decrypt ${p.piiType}:`, error);
          // If decryption fails, it might be old hashed data
          // Show appropriate message
          return {
            type: p.piiType,
            value:
              isAdmin || isOwner
                ? `[Encrypted Data - ${p.piiHash.slice(0, 8)}...]`
                : "******",
          };
        }
      })
    );

    return {
      id: kyc.id,
      profile: {
        name: `${kycWithRelations.user?.firstName || ""} ${kycWithRelations.user?.lastName || ""}`.trim(),
        userId: kyc.userId,
        email:
          isAdmin || isOwner ? kycWithRelations.user?.email || "-" : "***@***",
        phone:
          isAdmin || isOwner
            ? kycWithRelations.user?.phoneNumber || "-"
            : "**********",
        photo: kyc.photo || null,
        gender: kyc.gender || null,
        dob: kyc.dob || null,
        fatherName: kyc.fatherName || "-",
      },
      documents: pii,
      location: {
        city: kycWithRelations.address?.city?.cityName || "-",
        state: kycWithRelations.address?.state?.stateName || "-",
        address: kycWithRelations.address?.address || "-",
        pinCode: kycWithRelations.address?.pinCode || "-",
      },
      status: kyc.status,
      files: {
        panFile: kyc.panFile,
        aadhaarFile: kyc.aadhaarFile,
        addressProofFile: kyc.addressProofFile,
      },
      rejectReason: kyc.kycRejectionReason || null,
      createdAt: kyc.createdAt,
      updatedAt: kyc.updatedAt,
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

      // Create or replace PII consents - USE ENCRYPTION
      await Prisma.piiConsent.deleteMany({
        where: {
          userId: payload.userId,
          scope: "KYC_VERIFICATION",
        },
      });

      // ✅ Use CryptoService.encrypt() with proper error handling
      const createdPii = await Prisma.piiConsent.createMany({
        data: [
          {
            userId: payload.userId,
            userKycId: createdKyc.id,
            piiType: "PAN",
            piiHash: CryptoService.encrypt(payload.panNumber.toUpperCase()),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
            scope: "KYC_VERIFICATION",
          },
          {
            userId: payload.userId,
            userKycId: createdKyc.id,
            piiType: "AADHAAR",
            piiHash: CryptoService.encrypt(payload.aadhaarNumber),
            providedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
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
        kycRejectionReason: createdKyc.kycRejectionReason ?? "",
      };
    } catch (error) {
      console.error("storeUserKyc failed:", error);
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
    payload: Partial<UserKycUploadInput> & {
      status?: string;
      kycRejectionReason?: string | null;
      userId?: string; // Add userId to payload
    }
  ): Promise<UserKyc> {
    try {
      // First find the KYC by ID
      const existingKyc = await Prisma.userKyc.findUnique({
        where: { id: id },
      });

      if (!existingKyc) {
        throw ApiError.notFound("KYC not found");
      }

      // Then check if the user owns this KYC
      if (payload.userId && existingKyc.userId !== payload.userId) {
        throw ApiError.forbidden(
          "Access denied - you can only update your own KYC"
        );
      }

      const updates: any = {};

      // Personal information updates
      if (payload.firstName) updates.firstName = payload.firstName.trim();
      if (payload.lastName) updates.lastName = payload.lastName.trim();
      if (payload.fatherName) updates.fatherName = payload.fatherName.trim();
      if (payload.gender) updates.gender = payload.gender;
      if (payload.dob) updates.dob = new Date(payload.dob);

      // Auto-reset status to PENDING when updating rejected KYC
      if (existingKyc.status === "REJECT") {
        updates.status = "PENDING";
        updates.kycRejectionReason = null;
      } else {
        // Allow manual status update only if not rejected
        if (payload.status) updates.status = payload.status;
        if (payload.kycRejectionReason !== undefined) {
          updates.kycRejectionReason = payload.kycRejectionReason;
        }
      }

      // Handle file uploads
      const uploadTasks: Promise<string | null>[] = [];
      const fileFields: [keyof typeof payload, keyof typeof existingKyc][] = [
        ["panFile", "panFile"],
        ["photo", "photo"],
        ["aadhaarFile", "aadhaarFile"],
        ["addressProofFile", "addressProofFile"],
      ];

      for (const [fileField, dbField] of fileFields) {
        const file = payload[fileField] as any;
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

      // Update timestamp
      updates.updatedAt = new Date();

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
        kycRejectionReason: updatedKyc.kycRejectionReason ?? "",
      };
    } catch (error) {
      console.error("updateUserKyc failed:", error);
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

    if (enumStatus === "REJECT" && !payload.kycRejectionReason) {
      throw ApiError.badRequest(
        "Rejection reason is required when status is REJECTED"
      );
    }

    const updateVerify = await Prisma.userKyc.update({
      where: { id: existingKyc.id },
      data: {
        status: { set: enumStatus },
        ...(enumStatus === "REJECT"
          ? { kycRejectionReason: payload.kycRejectionReason || null }
          : { kycRejectionReason: null }),
      },
    });

    if (!updateVerify) {
      throw ApiError.internal("Failed to verify user KYC");
    }

    return {
      ...updateVerify,
      gender: updateVerify.gender as Gender,
      kycRejectionReason: updateVerify.kycRejectionReason ?? "",
    };
  }
}

export default KycServices;
