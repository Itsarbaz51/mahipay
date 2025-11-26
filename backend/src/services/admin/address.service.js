import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditService from "../audit.service.js";

export class AdminAddressService {
  static async getAddressById(addressId, currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      const address = await models.Address.findByPk(addressId, {
        include: [
          {
            model: models.State,
            as: "state",
            attributes: ["id", "stateName", "stateCode"],
          },
          {
            model: models.City,
            as: "city",
            attributes: ["id", "cityName", "cityCode"],
          },
        ],
      });

      if (!address) {
        throw ApiError.notFound("Address not found");
      }

      // AUDIT LOG
      await AuditService.createLog({
        action: "GET_ADDRESS_BY_ID",
        entity: "Address",
        entityId: addressId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin viewed address details`,
        status: "SUCCESS",
      });

      return address;
    } catch (error) {
      // AUDIT LOG FOR FAILED
      await AuditService.createLog({
        action: "GET_ADDRESS_BY_ID",
        entity: "Address",
        entityId: addressId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: "Admin failed to get address details",
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to get address: ${error.message}`);
    }
  }

  static async createAddress(currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { address, pinCode, stateId, cityId } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      // Check if state exists
      const stateExists = await models.State.findByPk(stateId, { transaction });
      if (!stateExists) {
        throw ApiError.notFound("State not found");
      }

      // Check if city exists
      const cityExists = await models.City.findByPk(cityId, { transaction });
      if (!cityExists) {
        throw ApiError.notFound("City not found");
      }

      const createdAddress = await models.Address.create(
        {
          address: address.trim(),
          pinCode,
          stateId,
          cityId,
        },
        { transaction }
      );

      const addressWithRelations = await models.Address.findByPk(
        createdAddress.id,
        {
          include: [
            {
              model: models.State,
              as: "state",
              attributes: ["id", "stateName", "stateCode"],
            },
            {
              model: models.City,
              as: "city",
              attributes: ["id", "cityName", "cityCode"],
            },
          ],
          transaction,
        }
      );

      // AUDIT LOG FOR CREATE
      await AuditService.createLog({
        action: "CREATE_ADDRESS",
        entity: "Address",
        entityId: createdAddress.id,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        newValues: {
          address: address,
          pinCode: pinCode,
          stateId: stateId,
          cityId: cityId,
        },
        description: `Admin created new address`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return addressWithRelations;
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED CREATE
      await AuditService.createLog({
        action: "CREATE_ADDRESS",
        entity: "Address",
        entityId: "new",
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin failed to create address`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to create address: ${error.message}`);
    }
  }

  static async updateAddress(addressId, currentUser, payload) {
    const transaction = await models.sequelize.transaction();

    try {
      const { address, pinCode, stateId, cityId } = payload;

      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      const existingAddress = await models.Address.findByPk(addressId, {
        transaction,
      });
      if (!existingAddress) {
        throw ApiError.notFound("Address not found");
      }

      const updateData = {};
      const oldValues = {};
      const changedFields = [];

      if (address !== undefined && address !== existingAddress.address) {
        updateData.address = address.trim();
        oldValues.address = existingAddress.address;
        changedFields.push("address");
      }

      if (pinCode !== undefined && pinCode !== existingAddress.pinCode) {
        updateData.pinCode = pinCode;
        oldValues.pinCode = existingAddress.pinCode;
        changedFields.push("pinCode");
      }

      if (stateId !== undefined && stateId !== existingAddress.stateId) {
        const stateExists = await models.State.findByPk(stateId, {
          transaction,
        });
        if (!stateExists) {
          throw ApiError.notFound("State not found");
        }
        updateData.stateId = stateId;
        oldValues.stateId = existingAddress.stateId;
        changedFields.push("stateId");
      }

      if (cityId !== undefined && cityId !== existingAddress.cityId) {
        const cityExists = await models.City.findByPk(cityId, { transaction });
        if (!cityExists) {
          throw ApiError.notFound("City not found");
        }
        updateData.cityId = cityId;
        oldValues.cityId = existingAddress.cityId;
        changedFields.push("cityId");
      }

      if (Object.keys(updateData).length === 0) {
        throw ApiError.badRequest("No valid fields to update");
      }

      await existingAddress.update(updateData, { transaction });

      const updatedAddress = await models.Address.findByPk(addressId, {
        include: [
          {
            model: models.State,
            as: "state",
            attributes: ["id", "stateName", "stateCode"],
          },
          {
            model: models.City,
            as: "city",
            attributes: ["id", "cityName", "cityCode"],
          },
        ],
        transaction,
      });

      // AUDIT LOG FOR UPDATE
      await AuditService.createLog({
        action: "UPDATE_ADDRESS",
        entity: "Address",
        entityId: addressId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues: oldValues,
        newValues: updateData,
        changedFields: changedFields,
        description: `Admin updated address`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return updatedAddress;
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED UPDATE
      await AuditService.createLog({
        action: "UPDATE_ADDRESS",
        entity: "Address",
        entityId: addressId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin failed to update address`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;
      throw ApiError.internal(`Failed to update address: ${error.message}`);
    }
  }

  static async deleteAddress(addressId, currentUser) {
    const transaction = await models.sequelize.transaction();

    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const adminExists = await models.User.findByPk(currentUser.id);
      if (!adminExists) throw ApiError.notFound("Admin user not found");

      const address = await models.Address.findByPk(addressId, { transaction });

      if (!address) {
        throw ApiError.notFound("Address not found");
      }

      // Check if address is linked to any KYC
      const userKycCount = await models.UserKyc.count({
        where: { addressId },
        transaction,
      });

      const businessKycCount = await models.BusinessKyc.count({
        where: { addressId },
        transaction,
      });

      if (userKycCount > 0 || businessKycCount > 0) {
        throw ApiError.forbidden(
          "Cannot delete address: linked KYC records exist"
        );
      }

      // Store address details for audit log
      const addressDetails = {
        id: address.id,
        address: address.address,
        pinCode: address.pinCode,
      };

      await models.Address.destroy({
        where: { id: addressId },
        transaction,
      });

      // AUDIT LOG FOR SUCCESSFUL DELETE
      await AuditService.createLog({
        action: "DELETE_ADDRESS",
        entity: "Address",
        entityId: addressId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        oldValues: addressDetails,
        description: `Admin deleted address`,
        status: "SUCCESS",
      });

      await transaction.commit();

      return { success: true };
    } catch (error) {
      await transaction.rollback();

      // AUDIT LOG FOR FAILED DELETE
      await AuditService.createLog({
        action: "DELETE_ADDRESS",
        entity: "Address",
        entityId: addressId,
        performedByType: currentUser.role,
        performedById: currentUser.id,
        description: `Admin failed to delete address`,
        status: "FAILED",
        errorMessage: error.message,
      });

      if (error instanceof ApiError) throw error;

      if (error.name === "SequelizeForeignKeyConstraintError") {
        throw ApiError.conflict(
          "Cannot delete address due to existing references"
        );
      }

      throw ApiError.internal(`Failed to delete address: ${error.message}`);
    }
  }
}

export default AdminAddressService;
