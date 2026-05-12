import { errorResponse } from "../utils/responseHandler.js";

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "superAdmin") {
    next();
  } else {
    return errorResponse(res, "Access denied. Admins only.", 403);
  }
};
