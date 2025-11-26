import { Op } from "sequelize";
import models from "../../models/index.js";
import { ApiError } from "../../utils/ApiError.js";

export class AdminRoleService {
  static async getAllRoles(currentUser) {
    try {
      if (!currentUser?.id) throw ApiError.unauthorized("You are unauthorized");

      const rootexists = await models.Root.findOne({
        where: { id: currentUser.id },
      });

      if (!rootexists) throw ApiError.notFound("Root user not found");

      let whereCondition = {};

      const userRole = await models.Role.findOne({
        where: { name: currentUser.role },
        attributes: ["hierarchyLevel"],
      });

      if (!userRole)
        throw ApiError.notFound(`Your ${currentUser.role} not found`);

      whereCondition = {
        name: {
          [Op.in]: ["ADMIN"],
        },
      };

      const roles = await models.Role.findAll({
        where: whereCondition,
        order: [["hierarchyLevel", "ASC"]],
        attributes: { exclude: ["createdByType", "createdById"] },
      });

      return {
        roles,
        count: roles.length,
      };
    } catch (error) {
      throw ApiError.internal(`Failed to get roles: ${error.message}`);
    }
  }
}

export default AdminRoleService;
