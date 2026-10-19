// src/controllers/authController.js
import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';



export const registerUserController = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createHttpError(409, 'Email in use'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const userObject = newUser.toObject();
    delete userObject.password;

    res.status(201).json(userObject);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(createHttpError(401, 'Invalid credentials'));
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(createHttpError(401, 'Invalid credentials'));
    }

    await Session.deleteOne({ userId: user._id });

    const session = await createSession(user._id);

    setSessionCookies(res, session);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};


export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (sessionId) {
      await Session.deleteOne({ _id: sessionId });
    }

    res.clearCookie('sessionId');
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const refreshSessionController = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies;

    if (!sessionId || !refreshToken) {
      return next(createHttpError(401, 'Session or refresh token missing'));
    }

    const session = await Session.findOne({ _id: sessionId, refreshToken });
    if (!session) {
      return next(createHttpError(401, 'Session not found'));
    }

    if (new Date() > new Date(session.refreshTokenValidUntil)) {
      await Session.deleteOne({ _id: sessionId });
      return next(createHttpError(401, 'Refresh token expired'));
    }

    await Session.deleteOne({ _id: sessionId });
    const newSession = await createSession(session.userId);

    setSessionCookies(res, newSession);

    res.status(200).json({
      accessToken: newSession.accessToken,
    });
  } catch (error) {
    next(error);
  }
};
