// src/server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { errors } from 'celebrate';

// import pino from 'pino-http';
import { connectMongoDB } from './db/connectMongoDB.js';

import { logger } from './middleware/logger.js';
import { errorHandler} from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

import notesRouter from './routes/notesRoutes.js';

import cookieParser from 'cookie-parser';
import authRouter from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

/* console.log("PORT from env:", process.env.PORT); // Має вивести значення твого PORT
console.log("DB_URI from env:", process.env.MONGO_URl); // Має вивести твою URI базу даних */

/* Middleware */
app.use(logger);
app.use(cors());
app.use(express.json());
app.use(cookieParser()); // 3. Підключи cookie-parser для роботи з req.cookies

// app.use(pino());
// 4. Головний маршрут для перевірки стану сервера
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// реестрація маршрутів
app.use(authRouter);
app.use(notesRouter);

// 404 — якщо маршрут не знайдено
app.use(notFoundHandler);

// Обробник помилок від celebrate має бути ПЕРЕД твоїм загальним errorHandler
app.use(errors());


/// 404 — якщо маршрут не знайдено
app.use(errorHandler);

// підключення до MongoDB
await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


