import express from "express";
import { announcementController } from "../controllers/announcementController.js";
import { authenticateToken, optionalAuth } from "../middleware/authentication.js";

const announcementRouter = express.Router();

announcementRouter.get("/", optionalAuth, announcementController.getAnnouncements);
announcementRouter.post("/", authenticateToken, announcementController.createAnnouncement);
announcementRouter.delete("/:id", authenticateToken, announcementController.deleteAnnouncement);

export default announcementRouter;
