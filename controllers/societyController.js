import Society from "../models/society.js";
import User from "../models/user.js";
import University from "../models/university.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const societyController = {
  // Public: list approved societies (optional university filter)
  getSocieties: async (req, res) => {
    try {
      const filter = { status: "approved", isActive: true };
      if (req.query.university) filter.university = req.query.university;

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [societies, total] = await Promise.all([
        Society.find(filter)
          .skip(skip)
          .limit(limit)
          .populate("university", "name")
          .populate("createdBy", "name"),
        Society.countDocuments(filter),
      ]);

      return successResponse(
        res,
        { societies, total, page, pages: Math.ceil(total / limit) },
        "Societies fetched"
      );
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // Public: get single approved society
  getSociety: async (req, res) => {
    try {
      const society = await Society.findOne({ _id: req.params.id, status: "approved", isActive: true })
        .populate("university", "name")
        .populate("createdBy", "name")
        .populate("societyAdmin", "name email");

      if (!society) return errorResponse(res, "Society not found.", 404);
      return successResponse(res, society, "Society fetched");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // Auth: submit society for approval
  createSociety: async (req, res) => {
    try {
      const { name, description, university, logo, societyAdminId } = req.body;
      if (!name || !university) return errorResponse(res, "name and university are required.", 400);

      if (!["uniAdmin", "superAdmin"].includes(req.user.role)) {
        return errorResponse(res, "Only uniAdmin can create a society.", 403);
      }

      const targetUniversity = await University.findOne({
        _id: university,
        status: "approved",
        isActive: true,
      });
      if (!targetUniversity) return errorResponse(res, "University not found.", 404);

      if (req.user.role === "uniAdmin") {
        // must be assigned to this university
        if (req.user.university?.toString() !== university) {
          return errorResponse(res, "uniAdmin can only create societies in their university.", 403);
        }
        // must be the specific uniAdmin who owns this university
        if (!targetUniversity.uniAdmin || targetUniversity.uniAdmin.toString() !== req.user.id) {
          return errorResponse(res, "Only the uniAdmin who registered this university can create societies in it.", 403);
        }
      }

      let assignedSocietyAdmin = null;
      if (societyAdminId) {
        const head = await User.findOne({ _id: societyAdminId, isVerified: true, isActive: true });
        if (!head) return errorResponse(res, "Society admin user not found.", 404);
        if (!head.university || head.university.toString() !== university) {
          return errorResponse(res, "Society admin must belong to the same university.", 400);
        }
        assignedSocietyAdmin = head._id;
      }

      const society = await Society.create({
        name,
        description,
        university,
        logo,
        createdBy: req.user.id,
        societyAdmin: assignedSocietyAdmin,
      });

      if (assignedSocietyAdmin) {
        await User.findByIdAndUpdate(assignedSocietyAdmin, {
          role: "societyAdmin",
          society: society._id,
        });
      }

      return successResponse(res, society, "Society submitted for approval.");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // SuperAdmin: list pending societies
  getPendingSocieties: async (req, res) => {
    try {
      if (!["uniAdmin", "superAdmin"].includes(req.user.role)) {
        return errorResponse(res, "Access denied.", 403);
      }

      const filter = { status: "pending", isActive: true };
      if (req.user.role === "uniAdmin") {
        if (!req.user.university) return errorResponse(res, "University not assigned for uniAdmin.", 400);
        filter.university = req.user.university;
      }

      const societies = await Society.find(filter)
        .populate("university", "name")
        .populate("createdBy", "name email");
      return successResponse(res, societies, "Pending societies fetched");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // SuperAdmin: approve society
  approveSociety: async (req, res) => {
    try {
      if (!["uniAdmin", "superAdmin"].includes(req.user.role)) {
        return errorResponse(res, "Access denied.", 403);
      }

      const society = await Society.findOne({ _id: req.params.id, isActive: true });
      if (!society) return errorResponse(res, "Society not found.", 404);

      if (
        req.user.role === "uniAdmin" &&
        req.user.university?.toString() !== society.university.toString()
      ) {
        return errorResponse(res, "uniAdmin can only approve societies in their university.", 403);
      }

      society.status = "approved";
      society.approvedBy = req.user.id;
      await society.save();

      return successResponse(res, society, "Society approved");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // SuperAdmin: reject society
  rejectSociety: async (req, res) => {
    try {
      if (!["uniAdmin", "superAdmin"].includes(req.user.role)) {
        return errorResponse(res, "Access denied.", 403);
      }

      const { reason } = req.body;
      const society = await Society.findOne({ _id: req.params.id, isActive: true });
      if (!society) return errorResponse(res, "Society not found.", 404);

      if (
        req.user.role === "uniAdmin" &&
        req.user.university?.toString() !== society.university.toString()
      ) {
        return errorResponse(res, "uniAdmin can only reject societies in their university.", 403);
      }

      society.status = "rejected";
      society.rejectionReason = reason || "";
      await society.save();

      return successResponse(res, society, "Society rejected");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // UniAdmin/SuperAdmin: assign a society admin user
  assignSocietyAdmin: async (req, res) => {
    try {
      if (!["uniAdmin", "superAdmin"].includes(req.user.role)) {
        return errorResponse(res, "Access denied.", 403);
      }

      const { userId } = req.body;
      if (!userId) return errorResponse(res, "userId is required.", 400);

      const society = await Society.findOne({ _id: req.params.id, isActive: true });
      if (!society) return errorResponse(res, "Society not found.", 404);

      if (
        req.user.role === "uniAdmin" &&
        req.user.university?.toString() !== society.university.toString()
      ) {
        return errorResponse(res, "uniAdmin can only manage societies in their university.", 403);
      }

      const user = await User.findOne({ _id: userId, isVerified: true, isActive: true });
      if (!user) return errorResponse(res, "User not found.", 404);

      if (!user.university || user.university.toString() !== society.university.toString()) {
        return errorResponse(res, "User must belong to the same university.", 400);
      }

      society.societyAdmin = user._id;
      await society.save();

      user.role = "societyAdmin";
      user.society = society._id;
      await user.save();

      return successResponse(res, society, "Society admin assigned successfully.");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },
};
