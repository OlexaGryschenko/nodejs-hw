// src/routes/authRoutes.js
import { Router } from 'express';
import { registerUserSchema } from '../validations/authValidation.js';
import { registerUserController, loginUser, refreshSessionController, logoutUser } from '../controllers/authController.js';

const authRouter = Router();

authRouter.post(
  '/register',
  registerUserSchema,
  registerUserController
);

authRouter.post(
  '/login',
  loginUser
);

authRouter.post(
  '/refresh',
  refreshSessionController
);

authRouter.post(
  '/logout',
  logoutUser
);

export default authRouter;
