import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import connectDB from "./utils/DB.js";
import { startCronJob } from "./utils/cronJob.js";
import authRouter from "./routes/authRoute.js";
import userRouter from "./routes/userRoute.js";
import universityRouter from "./routes/universityRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import commentRouter from "./routes/commentRoute.js";
import societyRouter from "./routes/societyRoute.js";
import announcementRouter from "./routes/announcementRoute.js";
import adminRouter from "./routes/adminRoute.js";

dotenv.config();
const app = express();

// Security middlewares
app.use(helmet());
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  if (req.headers) req.headers = mongoSanitize.sanitize(req.headers);
  if (req.query) {
    const sanitizedQuery = mongoSanitize.sanitize(req.query);
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, sanitizedQuery);
  }
  next();
});

// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     standardHeaders: true,
//     legacyHeaders: false,
//   })
// );

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Start cron job
// startCronJob();

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/universities", universityRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/comments", commentRouter);
app.use("/api/societies", societyRouter);
app.use("/api/announcements", announcementRouter);
app.use("/api/admin", adminRouter);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "unireview-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("Hello, World! Your server is running 🎉");
});

const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;