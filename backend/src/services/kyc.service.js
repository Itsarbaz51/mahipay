import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import S3Service from "../utils/S3Service.js";
import Helper from "../utils/helper.js";
import { CryptoService } from "../utils/cryptoService.js";

class KycServices {
  // users kyc
  static async indexUserKyc(params) {
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

    // --- Fetch from DB
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        children: { select: { id: true } },
      },
    });

    if (!user) throw ApiError.notFound("User not found");

    // Modified logic: ADMIN ko saare users, SUPER ADMIN ko apne created users
    let targetUserIds = [];

    if (user.role.name.toUpperCase() === "ADMIN") {
      // ADMIN ke liye saare users
      const allUsers = await Prisma.user.findMany({
        select: { id: true },
      });
      targetUserIds = allUsers.map((user) => user.id);
    } else {
      // SUPER ADMIN ke liye sirf apne created users
      targetUserIds = user.children.map((child) => child.id);
    }

    if (targetUserIds.length === 0) {
      const emptyResult = {
        data: [],
        meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
      };
      return emptyResult;
    }

    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId: { in: targetUserIds },
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
        user: {
          include: {
            parent: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
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

    const frontendData = kycs.map((kyc) => {
      const pii = kyc.piiConsents.map((p) => {
        if (p.piiType === "PAN")
          return {
            type: "PAN",
            value: p.piiHash.slice(0, 2) + "XXX" + p.piiHash.slice(-3),
          };
        if (p.piiType === "AADHAAR")
          return { type: "AADHAAR", value: "XXXX-XXXX-" + p.piiHash.slice(-4) };
        return { type: p.piiType, value: "******" };
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
        parent: {
          username: kyc.user.parent?.username || "N/A",
          name: kyc.user.parent
            ? `${kyc.user.parent.firstName} ${kyc.user.parent.lastName}`
            : "N/A",
        },
        documents: pii,
        location: {
          city: kyc.address?.city?.cityName || "-",
          state: kyc.address?.state?.stateName || "-",
          address: kyc.address?.address || "-",
          pinCode: kyc.address?.pinCode || "-",
        },
        type: kyc.type,
        status: kyc.status,
        createdAt: kyc.createdAt,
      };
    });

    const result = {
      data: frontendData,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    return result;
  }

  static async showUserKyc(id, requestingUser) {
    const kyc = await Prisma.userKyc.findFirst({
      where: { id },
      include: {
        address: {
          select: {
            id: true,
            address: true,
            pinCode: true,
            city: { select: { cityName: true } },
            state: { select: { stateName: true } },
          },
        },
        user: {
          select: {
            email: true,
            phoneNumber: true,
            username: true,
            parent: {
              select: {
                phoneNumber: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                hierarchyPath: true,
                hierarchyLevel: true,
              },
            },
          },
        },
        piiConsents: { select: { piiType: true, piiHash: true } },
      },
    });

    if (!kyc) throw ApiError.notFound("KYC not found");

    const kycWithRelations = kyc;

    const isOwner = requestingUser && kyc.userId === requestingUser.id;
    const isAdmin = requestingUser && requestingUser.role === "ADMIN";

    const pii = await Promise.all(
      kycWithRelations.piiConsents.map(async (p) => {
        try {
          const decryptedValue = await CryptoService.decrypt(p.piiHash);
          if (isAdmin || isOwner) {
            if (p.piiType === "AADHAAR" && decryptedValue.length === 12) {
              return {
                type: p.piiType,
                value: `${decryptedValue.slice(0, 4)}-${decryptedValue.slice(4, 8)}-${decryptedValue.slice(8)}`,
              };
            }
            return { type: p.piiType, value: decryptedValue };
          } else {
            let masked = "******";
            if (p.piiType === "PAN")
              masked = `${decryptedValue.slice(0, 2)}XXXX${decryptedValue.slice(-3)}`;
            else if (p.piiType === "AADHAAR")
              masked = `${decryptedValue.slice(0, 2)}XX-XXXX-${decryptedValue.slice(-4)}`;
            return { type: p.piiType, value: masked };
          }
        } catch (error) {
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

    const result = {
      id: kyc.id,
      profile: {
        name: `${kycWithRelations?.firstName || ""} ${kycWithRelations?.lastName || ""}`.trim(),
        userId: kyc.userId,
        gender: kyc.gender || null,
        dob: kyc.dob || null,
        fatherName: kyc.fatherName || "-",
        email: kyc.user.email || "-",
        phone: kyc.user.phoneNumber || "-",
      },
      parent: {
        username: kyc.user.parent?.username || "N/A",
        name: kyc.user.parent
          ? `${kyc.user.parent.firstName} ${kyc.user.parent.lastName}`
          : "N/A",
        hierarchyLevel: kyc.user.parent?.hierarchyLevel,
        hierarchyPath: kyc.user.parent?.hierarchyPath || "N/A",
        email: kyc.user.parent?.email || "N/A",
        phone: kyc.user.parent?.phoneNumber || "N/A",
      },
      documents: pii,
      location: {
        id: kycWithRelations.address?.id || null,
        city: kycWithRelations.address?.city?.cityName || "-",
        state: kycWithRelations.address?.state?.stateName || "-",
        address: kycWithRelations.address?.address || "-",
        pinCode: kycWithRelations.address?.pinCode || "-",
      },
      status: kyc.status,
      files: {
        photo: kyc.photo,
        panFile: kyc.panFile,
        aadhaarFile: kyc.aadhaarFile,
        addressProofFile: kyc.addressProofFile,
      },
      rejectReason: kyc.kycRejectionReason || null,
      createdAt: kyc.createdAt,
      updatedAt: kyc.updatedAt,
    };

    return result;
  }

  static async storeUserKyc(payload) {
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

      await Prisma.piiConsent.deleteMany({
        where: {
          userId: payload.userId,
          scope: "KYC_VERIFICATION",
        },
      });

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
        gender: createdKyc.gender,
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
        await Helper.deleteOldImage(filePath);
      }
    }
  }

  static async updateUserKyc(id, payload) {
    try {
      const existingKyc = await Prisma.userKyc.findUnique({
        where: { id: id },
      });

      if (!existingKyc) {
        throw ApiError.notFound("KYC not found");
      }

      if (payload.userId && existingKyc.userId !== payload.userId) {
        throw ApiError.forbidden(
          "Access denied - you can only update your own KYC"
        );
      }

      const updates = {};
      if (payload.firstName) updates.firstName = payload.firstName.trim();
      if (payload.lastName) updates.lastName = payload.lastName.trim();
      if (payload.fatherName) updates.fatherName = payload.fatherName.trim();
      if (payload.gender) updates.gender = payload.gender;
      if (payload.dob) updates.dob = new Date(payload.dob);

      if (existingKyc.status === "REJECT") {
        updates.status = "PENDING";
        updates.kycRejectionReason = null;
      } else {
        if (payload.status) updates.status = payload.status;
        if (payload.kycRejectionReason !== undefined) {
          updates.kycRejectionReason = payload.kycRejectionReason;
        }
      }

      const uploadTasks = [];
      const fileFields = [
        ["panFile", "panFile"],
        ["photo", "photo"],
        ["aadhaarFile", "aadhaarFile"],
        ["addressProofFile", "addressProofFile"],
      ];

      for (const [fileField, dbField] of fileFields) {
        const file = payload[fileField];
        if (file && typeof file === "object" && "path" in file) {
          uploadTasks.push(
            (async () => {
              const newUrl = await S3Service.upload(file.path, "user-kyc");
              if (newUrl) {
                const oldUrl = existingKyc[dbField];
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
        gender: updatedKyc.gender,
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
        await Helper.deleteOldImage(filePath);
      }
    }
  }

  static async verifyUserKyc(payload) {
    const existingKyc = await Prisma.userKyc.findFirst({
      where: { id: payload.id },
    });

    if (!existingKyc) {
      throw ApiError.notFound("KYC not found");
    }

    const enumStatus = payload.status;

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

    const updatedUser = await Prisma.user.update({
      where: { id: existingKyc.userId },
      data: {
        ...(enumStatus === "VERIFIED"
          ? { isKycVerified: true }
          : { isKycVerified: false }),
      },
    });

    if (!updatedUser) {
      throw ApiError.internal("Failed to update user KYC status");
    }

    return {
      ...updateVerify,
      gender: updateVerify.gender,
      kycRejectionReason: updateVerify.kycRejectionReason ?? "",
    };
  }
}

export default KycServices;
