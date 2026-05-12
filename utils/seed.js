/**
 * Seed script — creates a superAdmin user.
 * Usage: node utils/seed.js
 *
 * Set MONGO_URI and ADMIN_EMAIL / ADMIN_PASSWORD in your .env
 * or pass them as env vars inline:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret node utils/seed.js
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

import User from "../models/user.js";

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const email = process.env.ADMIN_EMAIL || "admin@unireview.com";
  const password = process.env.ADMIN_PASSWORD || "Admin@123";
  const name = process.env.ADMIN_NAME || "Super Admin";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("⚠️  SuperAdmin already exists:", email);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "superAdmin",
    isVerified: true,
  });

  console.log("🎉 SuperAdmin created:", email);
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
