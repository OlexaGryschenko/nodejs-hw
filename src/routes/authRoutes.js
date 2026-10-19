// src/routes/authRoutes.js
import { Router } from 'express';
import {
  registerUserSchema,
  loginUserSchema,
 } from '../validations/authValidation.js';
import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
} from '../controllers/authController.js';
import { celebrate } from 'celebrate';

const authRouter = Router();

authRouter.post('/register', celebrate(registerUserSchema), registerUser);
authRouter.post('/login', celebrate(loginUserSchema), loginUser);
authRouter.post('/refresh', refreshUserSession);
authRouter.post('/logout', logoutUser);

export default authRouter;
