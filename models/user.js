import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "societyAdmin", "uniAdmin", "superAdmin"],
      default: "student",
    },
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University", default: null },
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", default: null },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
