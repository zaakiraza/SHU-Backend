import Comment from "../models/comment.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const commentController = {
  // Public: get comments for a university (optional category filter)
  getComments: async (req, res) => {
    try {
      const { university, category } = req.query;
      if (!university) return errorResponse(res, "university query param is required.", 400);

      const filter = { university, isActive: true };
      if (category) filter.category = category;

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [comments, total] = await Promise.all([
        Comment.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("user", "name")
          .populate("category", "name")
          .populate("university", "name")
          .populate("replies.user", "name"),
        Comment.countDocuments(filter),
      ]);

      return successResponse(
        res,
        { comments, total, page, pages: Math.ceil(total / limit) },
        "Comments fetched"
      );
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // Auth: add comment — user can only comment on their own university
  addComment: async (req, res) => {
    try {
      const { text, university, category } = req.body;
      if (!text || !university || !category)
        return errorResponse(res, "text, university and category are required.", 400);

      if (!req.user.university || req.user.university.toString() !== university) {
        return errorResponse(res, "You can only comment on your own university.", 403);
      }

      const comment = await Comment.create({
        text,
        university,
        category,
        user: req.user.id,
      });

      await comment.populate(["user", "category", "university", "replies.user"]);
      return successResponse(res, comment, "Comment added");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // Auth: reply to a comment
  addReply: async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return errorResponse(res, "Reply text is required.", 400);

      const comment = await Comment.findOne({ _id: req.params.id, isActive: true });
      if (!comment) return errorResponse(res, "Comment not found.", 404);

      comment.replies.push({ text, user: req.user.id });
      await comment.save();
      await comment.populate("replies.user", "name");

      return successResponse(res, comment, "Reply added");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // Auth: toggle like on a comment
  toggleLike: async (req, res) => {
    try {
      const comment = await Comment.findById(req.params.id);
      if (!comment) return errorResponse(res, "Comment not found.", 404);

      const userId = req.user.id;
      const alreadyLiked = comment.likes.some((id) => id.toString() === userId);

      if (alreadyLiked) {
        comment.likes = comment.likes.filter((id) => id.toString() !== userId);
      } else {
        comment.likes.push(userId);
      }

      await comment.save();
      return successResponse(
        res,
        { likes: comment.likes.length, liked: !alreadyLiked },
        "Like toggled"
      );
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // Auth: delete own comment (superAdmin can delete any)
  deleteComment: async (req, res) => {
    try {
      const comment = await Comment.findById(req.params.id);
      if (!comment) return errorResponse(res, "Comment not found.", 404);

      if (
        comment.user.toString() !== req.user.id &&
        req.user.role !== "superAdmin"
      ) {
        return errorResponse(res, "You can only delete your own comments.", 403);
      }

      comment.isActive = false;
      await comment.save();
      return successResponse(res, null, "Comment deleted");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },
};
