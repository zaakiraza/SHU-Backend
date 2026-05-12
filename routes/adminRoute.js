import express from "express";
import { adminController } from "../controllers/adminController.js";
import { authenticateToken } from "../middleware/authentication.js";
import { admin } from "../middleware/admin.js";

const adminRouter = express.Router();

adminRouter.get("/pending", authenticateToken, admin, adminController.getPendingAll);
adminRouter.get("/users", authenticateToken, admin, adminController.getAllUsers);

export default adminRouter;
