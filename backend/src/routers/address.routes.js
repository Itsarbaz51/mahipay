// import { Router } from "express";
// import {
//   AddressController,
//   CityController,
//   StateController,
// } from "../controllers/address.controller.js";
// import AuthMiddleware from "../middlewares/auth.middleware.js";
// import PermissionMiddleware from "../middlewares/permission.middleware.js";
// import PermissionRegistry from "../utils/permissionRegistry.js";

// const addressRoutes = Router();

// // ===================== ADDRESS ROUTES =====================

// // Address operations (Users can manage their own addresses)
// addressRoutes.get(
//   "/address-show/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   PermissionMiddleware.requireResourceOwnership("address", "id"),
//   AddressController.show
// );

// addressRoutes.post(
//   "/address-store",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   AddressController.store
// );

// addressRoutes.put(
//   "/address-update/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   PermissionMiddleware.requireResourceOwnership("address", "id"),
//   AddressController.update
// );

// addressRoutes.delete(
//   "/address-delete/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     userTypes: ["business", "employee"],
//   }),
//   PermissionMiddleware.requireResourceOwnership("address", "id"),
//   AddressController.destroy
// );

// // ===================== STATE ROUTES =====================

// // State list (Public)
// addressRoutes.get("/state-list", StateController.index);

// // State management (ADMIN with permissions only)
// addressRoutes.post(
//   "/state-store",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.STATE_MANAGEMENT.STATE_CREATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.STATE_MANAGEMENT.STATE_CREATE
//   ),
//   StateController.store
// );

// addressRoutes.put(
//   "/state-update/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.STATE_MANAGEMENT.STATE_UPDATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.STATE_MANAGEMENT.STATE_UPDATE
//   ),
//   StateController.update
// );

// addressRoutes.delete(
//   "/state-delete/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.STATE_MANAGEMENT.STATE_DELETE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.STATE_MANAGEMENT.STATE_DELETE
//   ),
//   StateController.destroy
// );

// // ===================== CITY ROUTES =====================

// // City list (Public)
// addressRoutes.get("/city-list", CityController.index);

// // City management (ADMIN with permissions only)
// addressRoutes.post(
//   "/city-store",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.CITY_MANAGEMENT.CITY_CREATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.CITY_MANAGEMENT.CITY_CREATE
//   ),
//   CityController.store
// );

// addressRoutes.put(
//   "/city-update/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.CITY_MANAGEMENT.CITY_UPDATE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.CITY_MANAGEMENT.CITY_UPDATE
//   ),
//   CityController.update
// );

// addressRoutes.delete(
//   "/city-delete/:id",
//   AuthMiddleware.authenticate,
//   AuthMiddleware.authorize({
//     permissions: [PermissionRegistry.CITY_MANAGEMENT.CITY_DELETE],
//   }),
//   PermissionMiddleware.canActOnBehalfOfCreator(
//     PermissionRegistry.CITY_MANAGEMENT.CITY_DELETE
//   ),
//   CityController.destroy
// );

// export default addressRoutes;
