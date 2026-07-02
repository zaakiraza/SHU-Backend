/**
 * Full seed script — one record per collection.
 * Usage:  node utils/seed.js
 * Safe to re-run (deletes and recreates seed records by email/name).
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

import User         from "../models/user.js";
import University   from "../models/university.js";
import Society      from "../models/society.js";
import Category     from "../models/category.js";
import Comment      from "../models/comment.js";
import Announcement from "../models/announcement.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/SHU";

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB:", mongoose.connection.host);

  // ── 1. Clean up previous seed data (idempotent) ────────────────────────────
  const seedEmails = [
    "superadmin@seed.com",
    "uniadmin@seed.com",
    "student@seed.com",
    "societyadmin@seed.com",
  ];
  await User.deleteMany({ email: { $in: seedEmails } });
  await University.deleteMany({ emailDomain: "seed.edu" });
  await Category.deleteMany({ name: { $in: ["Faculty Review", "Campus Life", "Courses"] } });
  // Society, Comment, Announcement are cleaned via cascade below after we know the IDs

  // ── 2. Users ────────────────────────────────────────────────────────────────
  const hash = (pw) => bcrypt.hash(pw, 10);

  const superAdmin = await User.create({
    name: "Super Admin",
    email: "superadmin@seed.com",
    password: await hash("SuperAdmin@123"),
    role: "superAdmin",
    isVerified: true,
  });
  console.log("👤 superAdmin     :", superAdmin.email);

  const uniAdminUser = await User.create({
    name: "Uni Admin",
    email: "uniadmin@seed.com",
    password: await hash("UniAdmin@123"),
    role: "uniAdmin",
    isVerified: true,
  });
  console.log("👤 uniAdmin       :", uniAdminUser.email);

  const studentUser = await User.create({
    name: "Student User",
    email: "student@seed.com",
    password: await hash("Student@123"),
    role: "student",
    isVerified: true,
  });
  console.log("👤 student        :", studentUser.email);

  const societyAdminUser = await User.create({
    name: "Society Admin",
    email: "societyadmin@seed.com",
    password: await hash("SocietyAdmin@123"),
    role: "societyAdmin",
    isVerified: true,
  });
  console.log("👤 societyAdmin   :", societyAdminUser.email);

  // ── 3. University ───────────────────────────────────────────────────────────
  const university = await University.create({
    name: "Seed University",
    description: "A demo university created by the seed script.",
    location: "Lahore, Pakistan",
    website: "https://seed.edu",
    emailDomain: "seed.edu",
    logo: "",
    status: "approved",
    createdBy: uniAdminUser._id,
    uniAdmin: uniAdminUser._id,
    approvedBy: superAdmin._id,
  });
  console.log("🏫 University     :", university.name);

  // Assign university to uniAdmin, student and societyAdmin
  await User.updateMany(
    { _id: { $in: [uniAdminUser._id, studentUser._id, societyAdminUser._id] } },
    { $set: { university: university._id } }
  );

  // ── 4. Society ──────────────────────────────────────────────────────────────
  await Society.deleteMany({ name: "Seed Tech Society" });

  const society = await Society.create({
    name: "Seed Tech Society",
    description: "A demo tech society at Seed University.",
    university: university._id,
    logo: "",
    status: "approved",
    createdBy: uniAdminUser._id,
    societyAdmin: societyAdminUser._id,
    approvedBy: superAdmin._id,
  });
  console.log("🏛️  Society        :", society.name);

  // Assign society to societyAdmin
  await User.updateOne(
    { _id: societyAdminUser._id },
    { $set: { society: society._id } }
  );

  // ── 5. Categories ───────────────────────────────────────────────────────────
  const [catFaculty] = await Category.insertMany([
    { name: "Faculty Review", status: "approved", createdBy: superAdmin._id, approvedBy: superAdmin._id },
    { name: "Campus Life",    status: "approved", createdBy: superAdmin._id, approvedBy: superAdmin._id },
    { name: "Courses",        status: "approved", createdBy: superAdmin._id, approvedBy: superAdmin._id },
  ]);
  console.log("🏷️  Categories     : Faculty Review, Campus Life, Courses");

  // ── 6. Comment ──────────────────────────────────────────────────────────────
  const comment = await Comment.create({
    text: "The faculty here is incredibly supportive and the research opportunities are outstanding!",
    university: university._id,
    category: catFaculty._id,
    user: studentUser._id,
    likes: [uniAdminUser._id],
    replies: [
      {
        text: "Totally agree — best decision I made was joining this university.",
        user: societyAdminUser._id,
      },
    ],
  });
  console.log("💬 Comment        :", comment._id);

  // ── 7. Announcements ────────────────────────────────────────────────────────
  const announcements = await Announcement.insertMany([
    {
      title: "Annual Tech Fest 2026",
      content:
        "Join us for a two-day technology festival featuring workshops, hackathons, and guest speakers from top tech companies.",
      type: "event",
      society: society._id,
      createdBy: societyAdminUser._id,
      visibility: "all",
    },
    {
      title: "Software Engineering Internship – SeedCorp",
      content:
        "SeedCorp is offering paid summer internships for 3rd and 4th year CS students. Apply before June 30, 2026.",
      type: "internship",
      society: society._id,
      createdBy: societyAdminUser._id,
      visibility: "all",
    },
    {
      title: "New Member Induction Ceremony",
      content:
        "Welcome to all new members of the Seed Tech Society! Ceremony on May 20, 2026 at 3 PM in the main auditorium.",
      type: "induction",
      society: society._id,
      createdBy: societyAdminUser._id,
      visibility: "own_uni",
    },
  ]);
  console.log(`📢 Announcements  : ${announcements.length} created`);

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log("\n✅ Seed complete!\n");
  console.log("Login credentials:");
  console.log("  superAdmin   → superadmin@seed.com   / SuperAdmin@123");
  console.log("  uniAdmin     → uniadmin@seed.com     / UniAdmin@123");
  console.log("  student      → student@seed.com      / Student@123");
  console.log("  societyAdmin → societyadmin@seed.com / SocietyAdmin@123");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
