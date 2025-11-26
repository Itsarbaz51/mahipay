// import { Router } from "express";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import RootController from "../controllers/root.controller.js";
// import { validateRequest } from "../middlewares/validateRequest.js";
// import RootValidationSchemas from "../validations/rootValidation.schemas.js";

// const rootRoutes = Router();

// // Root-specific routes (Only Root users can access)
// rootRoutes.get(
//   "/dashboard",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.requireRoot,
//   RootController.getDashboard
// );

// rootRoutes.get(
//   "/system-overview",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.requireRoot,
//   RootController.getSystemOverview
// );

// rootRoutes.get(
//   "/financial-summary",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.requireRoot,
//   RootController.getFinancialSummary
// );

// rootRoutes.post(
//   "/create-admin",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.requireRoot,
//   validateRequest(RootValidationSchemas.createAdmin),
//   RootController.createAdmin
// );

// rootRoutes.get(
//   "/all-users",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.requireRoot,
//   RootController.getAllUsers
// );

// rootRoutes.get(
//   "/all-employees",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.requireRoot,
//   RootController.getAllEmployees
// );

// rootRoutes.get(
//   "/all-transactions",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.requireRoot,
//   RootController.getAllTransactions
// );

// export default rootRoutes;
