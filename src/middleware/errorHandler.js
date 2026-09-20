// Middleware для обробки помилок
import { isHttpError } from 'http-errors';

export const errorHandler = (err, _req, res, _next) => {
  console.error("Error Middleware:", err);

  // Якщо помилка створена через http-errors
  if (isHttpError(err)) {
    return res.status(err.status).json({
      message: err.message || err.name,
    });
  }

  const isProd = process.env.NODE_ENV === "production";

  // Усі інші помилки — як внутрішні

  res.status(500).json({
    message: isProd
      ? "Something went wrong. Please try again later."
      : err.message,
  });
};

export default errorHandler;
