import express from "express";
import { societyController } from "../controllers/societyController.js";
import { authenticateToken } from "../middleware/authentication.js";

const societyRouter = express.Router();

societyRouter.get("/", societyController.getSocieties);
societyRouter.get("/pending", authenticateToken, societyController.getPendingSocieties);
societyRouter.get("/:id", societyController.getSociety);
societyRouter.post("/", authenticateToken, societyController.createSociety);
societyRouter.patch("/:id/approve", authenticateToken, societyController.approveSociety);
societyRouter.patch("/:id/reject", authenticateToken, societyController.rejectSociety);
societyRouter.patch("/:id/assign-admin", authenticateToken, societyController.assignSocietyAdmin);

export default societyRouter;
