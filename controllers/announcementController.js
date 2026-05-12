import Announcement from "../models/announcement.js";
import Society from "../models/society.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const announcementController = {
  // Public/Auth: get announcements — society is optional; supports ?type= filter
  getAnnouncements: async (req, res) => {
    try {
      const { society: societyId, type } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      let filter = { isActive: true };

      if (societyId) {
        const society = await Society.findOne({ _id: societyId, status: "approved", isActive: true });
        if (!society) return errorResponse(res, "Society not found.", 404);

        filter.society = societyId;

        const sameUni =
          req.user &&
          req.user.university &&
          req.user.university.toString() === society.university.toString();

        filter.visibility = sameUni
          ? { $in: ["all", "own_uni", "specific_society"] }
          : "all";
      } else {
        // No society filter — only show globally public announcements
        filter.visibility = "all";
      }

      if (type) filter.type = type;

      const [announcements, total] = await Promise.all([
        Announcement.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("createdBy", "name")
          .populate("society", "name")
          .populate("targetSociety", "name"),
        Announcement.countDocuments(filter),
      ]);

      return successResponse(
        res,
        { announcements, total, page, pages: Math.ceil(total / limit) },
        "Announcements fetched"
      );
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // Auth: create announcement (user must belong to the society's university)
  createAnnouncement: async (req, res) => {
    try {
      const { title, content, type, society: societyId, visibility, targetSociety } = req.body;
      if (!title || !content || !societyId)
        return errorResponse(res, "title, content and society are required.", 400);

      const society = await Society.findOne({ _id: societyId, status: "approved", isActive: true });
      if (!society) return errorResponse(res, "Society not found.", 404);

      if (
        !req.user.university ||
        req.user.university.toString() !== society.university.toString()
      ) {
        return errorResponse(
          res,
          "You can only post announcements for societies in your university.",
          403
        );
      }

      if (visibility === "specific_society" && !targetSociety) {
        return errorResponse(
          res,
          "targetSociety is required when visibility is specific_society.",
          400
        );
      }

      const announcement = await Announcement.create({
        title,
        content,
        type: type || "other",
        society: societyId,
        createdBy: req.user.id,
        visibility: visibility || "all",
        targetSociety: visibility === "specific_society" ? targetSociety : null,
      });

      return successResponse(res, announcement, "Announcement created");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // Auth: delete own announcement (superAdmin can delete any)
  deleteAnnouncement: async (req, res) => {
    try {
      const announcement = await Announcement.findOne({ _id: req.params.id, isActive: true });
      if (!announcement) return errorResponse(res, "Announcement not found.", 404);

      if (
        announcement.createdBy.toString() !== req.user.id &&
        req.user.role !== "superAdmin"
      ) {
        return errorResponse(res, "You can only delete your own announcements.", 403);
      }

      announcement.isActive = false;
      await announcement.save();
      return successResponse(res, null, "Announcement deleted");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },
};
