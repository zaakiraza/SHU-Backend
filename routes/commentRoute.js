import express from "express";
import { commentController } from "../controllers/commentController.js";
import { authenticateToken } from "../middleware/authentication.js";

const commentRouter = express.Router();

commentRouter.get("/", commentController.getComments);
commentRouter.post("/", authenticateToken, commentController.addComment);
commentRouter.post("/:id/reply", authenticateToken, commentController.addReply);
commentRouter.post("/:id/like", authenticateToken, commentController.toggleLike);
commentRouter.delete("/:id", authenticateToken, commentController.deleteComment);

export default commentRouter;
