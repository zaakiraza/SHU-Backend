import mongoose from "mongoose";

const universitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    emailDomain: { type: String, default: "" },
    logo: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uniAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectionReason: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const University = mongoose.model("University", universitySchema);
export default University;
