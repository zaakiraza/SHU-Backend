import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["induction", "event", "internship", "other"],
      default: "other",
    },
    society: { type: mongoose.Schema.Types.ObjectId, ref: "Society", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    visibility: {
      type: String,
      enum: ["own_uni", "specific_society", "all"],
      default: "all",
    },
    // Used when visibility === "specific_society"
    targetSociety: { type: mongoose.Schema.Types.ObjectId, ref: "Society", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
