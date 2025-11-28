import models from "../models/index.js";

class HierarchyService {
  static async isChildOfAdmin(adminUserId, targetUserId) {
    try {
      const { User, Employee } = models;

      let targetUser = await User.findByPk(targetUserId, {
        attributes: ["hierarchyPath"],
      });

      let targetHierarchyPath = null;
      let targetType = null;

      if (targetUser) {
        targetHierarchyPath = targetUser.hierarchyPath;
        targetType = "USER";
      } else {
        // If not found in User table, check Employee table
        targetUser = await Employee.findByPk(targetUserId, {
          attributes: ["hierarchyPath"],
        });

        if (targetUser) {
          targetHierarchyPath = targetUser.hierarchyPath;
          targetType = "EMPLOYEE";
        }
      }

      if (!targetHierarchyPath) return false;

      // Get admin user's hierarchy path (admin is always from User table)
      const adminUser = await User.findByPk(adminUserId, {
        attributes: ["hierarchyPath"],
      });

      if (!adminUser) return false;

      // Check if target user is in admin's hierarchy
      const isInHierarchy = targetHierarchyPath.startsWith(
        adminUser.hierarchyPath
      );

      return {
        isChild: isInHierarchy,
        targetType: targetType,
      };
    } catch (error) {
      console.error("Error in hierarchy check:", error);
      return {
        isChild: false,
        targetType: null,
      };
    }
  }
}

export default HierarchyService;
