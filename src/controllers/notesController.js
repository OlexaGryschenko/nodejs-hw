// src/controllers/notesController.js
import createHttpError from 'http-errors';
import { Note } from "../models/note.js";


export const getAllNotes = async (req, res, next) => {
  try {
    const { tag, search, page = 1, perPage = 10 } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(perPage);
    const skip = (pageNumber - 1) * limitNumber;

    const mongooseQuery = Note.find().where('userId').equals(req.user._id);
if (tag) {
      mongooseQuery.where('tag').equals(tag);
    }
    if (search) {
      mongooseQuery.or([
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ]);
    }

    // Паралельне виконання запитів через Promise.all
    const [notes, totalNotes] = await Promise.all([
      mongooseQuery.clone().skip(skip).limit(limitNumber),
      mongooseQuery.clone().countDocuments(),
    ]);

    const totalPages = Math.ceil(totalNotes / limitNumber);

    res.status(200).json({
      status: 200,
      message: 'Successfully retrieved notes',
      data: {
        page: pageNumber,
        perPage: limitNumber,
        totalNotes,
        totalPages,
        notes,
      },
    });

  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await Note.findOne({ _id: id, userId: req.user._id });

    if (!note) {
      return next(createHttpError(404, 'Note not found'));
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};
export const createNote = async (req, res, next) => {
  try {
    const newNote = await Note.create({
    ...req.body,
    userId:req.user._id,
    });
    res.status(201).json(newNote);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await Note.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!note) {
      return next(createHttpError(404, 'Note not found'));
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const note = await Note.findOneAndUpdate(
      { _id: id, userId: req.user._id }, req.body, {
      returnDocument: 'after',
    });

    if (!note) {
      return next(createHttpError(404, 'Note not found'));
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};
