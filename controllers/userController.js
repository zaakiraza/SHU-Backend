import User from "../models/user.js";
import { errorResponse, successResponse } from "../utils/responseHandler.js";

export const userController = {
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().select("-password");
      return successResponse(res, users, "Users fetched successfully");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },
};
