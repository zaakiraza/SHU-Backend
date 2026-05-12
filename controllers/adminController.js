import University from "../models/university.js";
import Society from "../models/society.js";
import Category from "../models/category.js";
import User from "../models/user.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const adminController = {
  // SuperAdmin: aggregate all pending items in one call
  getPendingAll: async (req, res) => {
    try {
      const [universities, societies, categories] = await Promise.all([
        University.find({ status: "pending", isActive: true }).populate("createdBy", "name email"),
        Society.find({ status: "pending", isActive: true })
          .populate("createdBy", "name email")
          .populate("university", "name"),
        Category.find({ status: "pending", isActive: true }).populate("createdBy", "name email"),
      ]);

      return successResponse(
        res,
        { universities, societies, categories },
        "Pending items fetched"
      );
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // SuperAdmin: paginated list of all users
  getAllUsers: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        User.find()
          .select("-password -otp -otpExpiry")
          .where({ isActive: true })
          .skip(skip)
          .limit(limit)
          .populate("university", "name"),
        User.countDocuments({ isActive: true }),
      ]);

      return successResponse(
        res,
        { users, total, page, pages: Math.ceil(total / limit) },
        "Users fetched"
      );
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },
};
