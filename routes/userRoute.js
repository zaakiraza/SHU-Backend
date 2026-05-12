import express from 'express';
import { authenticateToken } from '../middleware/authentication.js';
import { admin } from '../middleware/admin.js';
import { userController } from '../controllers/userController.js';

const userRouter = express.Router();
userRouter.get('/', authenticateToken, admin, userController.getAllUsers);

export default userRouter;
