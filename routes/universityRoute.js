import express from "express";
import { universityController } from "../controllers/universityController.js";
import { authenticateToken } from "../middleware/authentication.js";
import { admin } from "../middleware/admin.js";

const universityRouter = express.Router();

universityRouter.get("/", universityController.getUniversities);
universityRouter.get("/pending", authenticateToken, admin, universityController.getPendingUniversities);
universityRouter.get("/:id", universityController.getUniversity);
universityRouter.post("/", authenticateToken, universityController.createUniversity);
universityRouter.patch("/:id/approve", authenticateToken, admin, universityController.approveUniversity);
universityRouter.patch("/:id/reject", authenticateToken, admin, universityController.rejectUniversity);

export default universityRouter;
