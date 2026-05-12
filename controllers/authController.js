import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { errorResponse, successResponse } from "../utils/responseHandler.js";
import { sendEmail } from "../utils/nodeMailer.js";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const authController = {
  registerUser: async (req, res) => {
    try {
      const { name, email, password, role, universityId } = req.body;
      if (!name || !email || !password)
        return errorResponse(res, "Name, email and password are required.", 400);

      const allowedRoles = ["student", "uniAdmin"];
      if (role && !allowedRoles.includes(role))
        return errorResponse(res, `Role must be one of: ${allowedRoles.join(", ")}.`, 400);

      const assignedRole = role || "student";

      // uniAdmin registers without a university (they will create one)
      // student can optionally link to an existing approved university
      if (assignedRole === "student" && universityId) {
        const { isValidObjectId } = await import("mongoose");
        if (!isValidObjectId(universityId))
          return errorResponse(res, "universityId must be a valid MongoDB ObjectId.", 400);
      }

      const existing = await User.findOne({ email });
      if (existing) return errorResponse(res, "Email already registered.", 409);

      const hashedPassword = await bcrypt.hash(password, 10);
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
        university: assignedRole === "student" ? (universityId || null) : null,
        otp,
        otpExpiry,
      });

      await sendEmail(
        email,
        "Verify your account — UniReview",
        `Your OTP is: ${otp}. It expires in 10 minutes.`,
        `<p>Your OTP is: <b>${otp}</b>. It expires in 10 minutes.</p>`
      );

      return successResponse(
        res,
        { userId: user._id },
        "Registration successful. Please verify your email with the OTP sent."
      );
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  verifyOtp: async (req, res) => {
    try {
      const { userId, otp } = req.body;
      if (!userId || !otp) return errorResponse(res, "userId and otp are required.", 400);

      const user = await User.findById(userId);
      if (!user) return errorResponse(res, "User not found.", 404);
      if (user.isVerified) return errorResponse(res, "Account already verified.", 400);
      if (!user.otp || user.otp !== otp) return errorResponse(res, "Invalid OTP.", 400);
      if (user.otpExpiry < new Date()) return errorResponse(res, "OTP has expired.", 400);

      user.isVerified = true;
      user.otp = null;
      user.otpExpiry = null;
      await user.save();

      return successResponse(res, null, "Email verified successfully. You can now log in.");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  resendOtp: async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) return errorResponse(res, "userId is required.", 400);

      const user = await User.findById(userId);
      if (!user) return errorResponse(res, "User not found.", 404);
      if (user.isVerified) return errorResponse(res, "Account already verified.", 400);

      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      await sendEmail(
        user.email,
        "Resend OTP — UniReview",
        `Your new OTP is: ${otp}. It expires in 10 minutes.`,
        `<p>Your new OTP is: <b>${otp}</b>. It expires in 10 minutes.</p>`
      );

      return successResponse(res, null, "OTP resent successfully.");
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },

  loginUser: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password)
        return errorResponse(res, "Email and password are required.", 400);

      const user = await User.findOne({ email });
      if (!user) return errorResponse(res, "User not found.", 404);
      if (!user.isVerified)
        return errorResponse(res, "Please verify your email before logging in.", 403);

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return errorResponse(res, "Invalid credentials.", 400);

      const token = jwt.sign(
        { id: user._id, role: user.role, university: user.university, society: user.society },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return successResponse(
        res,
        {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            university: user.university,
            society: user.society,
          },
        },
        "Login successful"
      );
    } catch (error) {
      return errorResponse(res, error.message);
    }
  },
};
