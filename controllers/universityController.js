import University from "../models/university.js";
import User from "../models/user.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

const PAGE_SIZE = 10;

export const universityController = {
  // Public: list approved universities
  getUniversities: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || PAGE_SIZE;
      const skip = (page - 1) * limit;

      const [universities, total] = await Promise.all([
        University.find({ status: "approved", isActive: true })
          .skip(skip)
          .limit(limit)
          .populate("createdBy", "name email"),
        University.countDocuments({ status: "approved", isActive: true }),
      ]);

      return successResponse(
        res,
        { universities, total, page, pages: Math.ceil(total / limit) },
        "Universities fetched"
      );
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // Public: get single approved university
  getUniversity: async (req, res) => {
    try {
      const university = await University.findOne({
        _id: req.params.id,
        status: "approved",
        isActive: true,
      }).populate("createdBy", "name email");

      if (!university) return errorResponse(res, "University not found.", 404);
      return successResponse(res, university, "University fetched");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // Auth: submit university for approval
  createUniversity: async (req, res) => {
    try {
      const { name, description, location, website, emailDomain, logo } = req.body;
      if (!name) return errorResponse(res, "University name is required.", 400);

      const requester = await User.findById(req.user.id);
      if (!requester || !requester.isActive) return errorResponse(res, "User not found.", 404);

      if (!["uniAdmin", "superAdmin"].includes(requester.role)) {
        return errorResponse(res, "Only uniAdmin or superAdmin can create a university.", 403);
      }

      const exists = await University.findOne({ name: new RegExp(`^${name}$`, "i") });
      if (exists) return errorResponse(res, "A university with this name already exists.", 409);

      const university = await University.create({
        name,
        description,
        location,
        website,
        emailDomain,
        logo,
        createdBy: requester._id,
        uniAdmin: requester._id,
      });

      return successResponse(res, university, "University submitted for approval.");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // SuperAdmin: list pending universities
  getPendingUniversities: async (req, res) => {
    try {
      const universities = await University.find({ status: "pending", isActive: true }).populate(
        "createdBy",
        "name email"
      );
      return successResponse(res, universities, "Pending universities fetched");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // SuperAdmin: approve university
  approveUniversity: async (req, res) => {
    try {
      const university = await University.findById(req.params.id);
      if (!university) return errorResponse(res, "University not found.", 404);

      university.status = "approved";
      university.approvedBy = req.user.id;
      await university.save();

      if (university.uniAdmin) {
        await User.findByIdAndUpdate(university.uniAdmin, {
          role: "uniAdmin",
          university: university._id,
        });
      }

      return successResponse(res, university, "University approved");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  // SuperAdmin: reject university
  rejectUniversity: async (req, res) => {
    try {
      const { reason } = req.body;
      const university = await University.findById(req.params.id);
      if (!university) return errorResponse(res, "University not found.", 404);

      university.status = "rejected";
      university.rejectionReason = reason || "";
      await university.save();

      return successResponse(res, university, "University rejected");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },
};
