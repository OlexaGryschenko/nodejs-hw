// src/controllers/userController.js

import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const updateUserAvatar = async (req, res, next) => {
  try {
    const { file, user } = req;

    if (!file) {
      throw createHttpError(400, 'No file');
    }

    // Завантажуємо в Cloudinary
    const result = await saveFileToCloudinary(file.buffer, user._id);

    // Оновлюємо в базі
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { avatar: result.secure_url },
      { new: true } // у Mongoose частіше використовують new: true для повернення оновленого документа
    );

    // Повертаємо НОВИЙ url
    res.status(200).json({ url: updatedUser.avatar });
  } catch (error) {
    next(error);
  }
};
