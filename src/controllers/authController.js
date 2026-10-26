// src/controllers/authController.js
import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'node:fs/promises';
import path from 'node:path';
import Handlebars from 'handlebars';

import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';



export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(createHttpError(400, 'Email in use'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const session = await createSession(newUser._id);
    setSessionCookies(res, session);

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

export const refreshUserSession = async (req, res, next) => {
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
      res.clearCookie('sessionId');
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return next(createHttpError(401, 'Refresh token expired'));
    }

    await Session.deleteOne({ _id: sessionId });
    const newSession = await createSession(session.userId);

    setSessionCookies(res, newSession);

    res.status(200).json({
      status: 200,
      message: 'Successfully refreshed a session!',
      accessToken: newSession.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        message: 'Password reset email sent successfully',
      });
    }

    const resetToken = jwt.sign(
      { sub: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetLink = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`;

    const templatePath = path.join(process.cwd(), 'src', 'templates', 'reset-password-email.html');
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateSource);

    const html = template({
      name: user.name,
      link: resetLink,
    });

    try {
      await sendEmail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Reset your password',
        html,
      });
    } catch {
      return next(createHttpError(500, 'Failed to send the email, please try again later.'));
    }

    res.status(200).json({
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};


export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // 1. Перевіряємо/декодуємо токен
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Повертаємо помилку якщо проблема при декодуванні
      throw createHttpError(401, 'Invalid or expired token');
    }

    // 2. Шукаємо користувача
    const user = await User.findOne({ _id: payload.sub, email: payload.email });
    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    // 3. Якщо користувач існує
    // створюємо новий пароль і оновлюємо користувача
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne(
      { _id: user._id },
      { password: hashedPassword }
    );

    // 4. Інвалідовуємо всі можливі попередні сесії користувача
    await Session.deleteMany({ userId: user._id });

    // 5. Повертаємо успішну відповідь
    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
