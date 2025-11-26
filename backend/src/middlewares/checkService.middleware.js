// checkServiceMiddleware.js
import { ApiError } from "../utils/ApiError.js";
import models from "../models/index.js";

export const checkServiceMiddleware = (action = "view") => {
  return async (req, _, next) => {
    try {
      const currentUser = req.user;
      const serviceId = req.params.id || req.body.serviceId;
      const targetUserId = req.body.userId;
      const serviceIds = req.body.serviceIds;
      const assignments = req.body.assignments;

      // ROOT has full access
      if (currentUser.role === "ROOT") {
        return next();
      }

      // ADMIN has hierarchy access
      if (currentUser.role === "ADMIN") {
        // For assignment operations - check if target user is in admin's hierarchy
        if (action === "assign" && targetUserId) {
          const canAssign = await canAssignToUser(currentUser.id, targetUserId);
          if (!canAssign) {
            throw new ApiError.forbidden(
              "You can only assign services to users in your hierarchy"
            );
          }
          return next();
        }

        // For service operations - check if service belongs to admin's hierarchy
        if (serviceId) {
          const hasAccess = await hasServiceAccess(
            currentUser.id,
            serviceId,
            action
          );
          if (!hasAccess) {
            throw new ApiError.forbidden(
              `You don't have permission to ${action} this service`
            );
          }
          return next();
        }

        // For bulk operations - validate each item
        if (serviceIds && Array.isArray(serviceIds)) {
          await validateBulkServiceAccess(currentUser.id, serviceIds, action);
          return next();
        }

        if (assignments && Array.isArray(assignments)) {
          await validateBulkAssignmentAccess(
            currentUser.id,
            assignments,
            action
          );
          return next();
        }

        // For general service access (like listing)
        return next();
      }

      // EMPLOYEE - check based on creator
      if (currentUser.userType === "EMPLOYEE") {
        // ROOT_EMPLOYEE has full access (like ROOT)
        if (currentUser.creator === "ROOT") {
          return next();
        }

        // ADMIN_EMPLOYEE has hierarchy access (like ADMIN)
        if (currentUser.creator === "ADMIN") {
          // For assignment operations - check if target user is in admin's hierarchy
          if (action === "assign" && targetUserId) {
            const canAssign = await canAssignToUser(
              currentUser.createdBy,
              targetUserId
            );
            if (!canAssign) {
              throw new ApiError.forbidden(
                "You can only assign services to users in your admin's hierarchy"
              );
            }
            return next();
          }

          // For service operations - check if service belongs to admin's hierarchy
          if (serviceId) {
            const hasAccess = await hasServiceAccess(
              currentUser.createdBy,
              serviceId,
              action
            );
            if (!hasAccess) {
              throw new ApiError.forbidden(
                `You don't have permission to ${action} this service`
              );
            }
            return next();
          }

          // For bulk operations - validate each item
          if (serviceIds && Array.isArray(serviceIds)) {
            await validateBulkServiceAccess(
              currentUser.createdBy,
              serviceIds,
              action
            );
            return next();
          }

          if (assignments && Array.isArray(assignments)) {
            await validateBulkAssignmentAccess(
              currentUser.createdBy,
              assignments,
              action
            );
            return next();
          }

          // For general service access (like listing)
          return next();
        }

        // Direct EMPLOYEES (without creator context) - limited access
        throw new ApiError.forbidden(
          "Insufficient permissions for direct employees"
        );
      }

      throw new ApiError.forbidden("Insufficient permissions");
    } catch (error) {
      next(error);
    }
  };
};

// Helper function to check if admin can assign to target user
const canAssignToUser = async (adminId, targetUserId) => {
  const hierarchyUsers = await getHierarchyUsers(adminId);
  return hierarchyUsers.includes(parseInt(targetUserId));
};

// Helper function to check service access
const hasServiceAccess = async (adminId, serviceId, action) => {
  const service = await models.ServiceProvider.findByPk(serviceId, {
    include: [
      {
        model: models.User,
        as: "user",
        attributes: ["id", "parentId"],
      },
    ],
  });

  if (!service) {
    throw new ApiError.notFound("Service not found");
  }

  const hierarchyUsers = await getHierarchyUsers(adminId);
  return hierarchyUsers.includes(service.user.id);
};

// Helper function to validate bulk service operations
const validateBulkServiceAccess = async (adminId, serviceIds, action) => {
  const hierarchyUsers = await getHierarchyUsers(adminId);

  for (const serviceId of serviceIds) {
    const service = await models.ServiceProvider.findByPk(serviceId, {
      include: [
        {
          model: models.User,
          as: "user",
          attributes: ["id"],
        },
      ],
    });

    if (!service || !hierarchyUsers.includes(service.user.id)) {
      throw new ApiError.forbidden(
        `You don't have access to service: ${serviceId}`
      );
    }
  }
};

// Helper function to validate bulk assignment operations
const validateBulkAssignmentAccess = async (adminId, assignments, action) => {
  const hierarchyUsers = await getHierarchyUsers(adminId);

  for (const assignment of assignments) {
    if (
      !assignment.userId ||
      !hierarchyUsers.includes(parseInt(assignment.userId))
    ) {
      throw new ApiError.forbidden(
        `You cannot assign services to user: ${assignment.userId}`
      );
    }
  }
};

// Get all users in admin's hierarchy (excluding equal or higher roles)
const getHierarchyUsers = async (adminId) => {
  const getAllChildrenIds = async (parentId) => {
    const children = await models.User.findAll({
      where: { parentId },
      attributes: ["id"],
      include: [
        {
          model: models.Role,
          attributes: ["name"],
        },
      ],
    });

    let allIds = [];

    for (const child of children) {
      // Exclude users with ROOT or ROOT_EMPLOYEE roles from hierarchy
      if (child.role.name !== "ROOT" && child.role.name !== "ROOT_EMPLOYEE") {
        allIds.push(child.id);
        const grandchildrenIds = await getAllChildrenIds(child.id);
        allIds = [...allIds, ...grandchildrenIds];
      }
    }

    return allIds;
  };

  return await getAllChildrenIds(adminId);
};

export default checkServiceMiddleware;
