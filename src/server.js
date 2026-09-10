// src/server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pino from 'pino-http';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
})); // Опціонально для кращої читабельності в консолі розробки

app.get('/notes', (req, res) => {
  res.status(200).json({
    message: "Retrieved all notes"
  });
});

app.get('/notes/:noteId', (req, res) => {
  const { noteId } = req.params;
  res.status(200).json({
    message: `Retrieved note with ID: ${noteId}`
  });
});


app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// Глобальний middleware для обробки помилок (500)
app.use((err, req, res, next) => {
  res.status(500).json({
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
