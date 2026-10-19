// src/middleware/authenticate.js
import createHttpError from 'http-errors';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';

export const authenticate = async (req, res, next) => {
  try {
    const {sessionId, accessToken } = req.cookies;

    if (!sessionId || !accessToken) {
      return next(createHttpError(401, 'Session ID and Access Token are required'));
    }

    const session = await Session.findOne({ _id: sessionId, accessToken });
    if (!session) {
      return next(createHttpError(401, 'Session not found'));
    }

    if (new Date() > new Date(session.accessTokenValidUntil)) {
      return next(createHttpError(401, 'Access token expired'));
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return next(createHttpError(401));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
