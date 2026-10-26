// src/routes/authRoutes.js
import { Router } from 'express';
import {
  registerUserSchema,
  loginUserSchema,
  requestResetEmailSchema,
  resetPasswordSchema,
 } from '../validations/authValidation.js';
import {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
  requestResetEmail,
  resetPassword,
} from '../controllers/authController.js';
import { celebrate } from 'celebrate';

const authRouter = Router();

authRouter.post('/register', celebrate(registerUserSchema), registerUser);
authRouter.post('/login', celebrate(loginUserSchema), loginUser);
authRouter.post('/refresh', refreshUserSession);
authRouter.post('/logout', logoutUser);
authRouter.post('/request-reset-email', celebrate(requestResetEmailSchema), requestResetEmail);
authRouter.post('/reset-password', celebrate(resetPasswordSchema), resetPassword);

export default authRouter;
