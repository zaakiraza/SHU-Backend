import Category from "../models/category.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const categoryController = {
  // Public: list approved global categories
  getCategories: async (req, res) => {
    try {
      const categories = await Category.find({ status: "approved", isActive: true });
      return successResponse(res, categories, "Categories fetched");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // SuperAdmin: list pending categories
  getPendingCategories: async (req, res) => {
    try {
      const categories = await Category.find({ status: "pending", isActive: true })
        .populate("createdBy", "name email");
      return successResponse(res, categories, "Pending categories fetched");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // Auth: submit category for approval
  createCategory: async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return errorResponse(res, "Category name is required.", 400);

      const exists = await Category.findOne({
        name: new RegExp(`^${name}$`, "i"),
      });
      if (exists) return errorResponse(res, "Category already exists.", 409);

      const category = await Category.create({
        name,
        createdBy: req.user.id,
      });

      return successResponse(res, category, "Category submitted for approval.");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // SuperAdmin: approve category
  approveCategory: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) return errorResponse(res, "Category not found.", 404);

      category.status = "approved";
      category.approvedBy = req.user.id;
      await category.save();

      return successResponse(res, category, "Category approved");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // SuperAdmin: reject category
  rejectCategory: async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) return errorResponse(res, "Category not found.", 404);

      category.status = "rejected";
      await category.save();

      return successResponse(res, category, "Category rejected");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },
};
