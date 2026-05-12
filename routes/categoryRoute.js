import express from "express";
import { categoryController } from "../controllers/categoryController.js";
import { authenticateToken } from "../middleware/authentication.js";
import { admin } from "../middleware/admin.js";

const categoryRouter = express.Router();

categoryRouter.get("/", categoryController.getCategories);
categoryRouter.get("/pending", authenticateToken, admin, categoryController.getPendingCategories);
categoryRouter.post("/", authenticateToken, categoryController.createCategory);
categoryRouter.patch("/:id/approve", authenticateToken, admin, categoryController.approveCategory);
categoryRouter.patch("/:id/reject", authenticateToken, admin, categoryController.rejectCategory);

export default categoryRouter;
