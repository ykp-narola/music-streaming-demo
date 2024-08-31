const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
    try {
      const songs = await Song.find();
      res.json(songs);
    } catch (err) {
      console.log('err :>> ', err);
      res.status(500).json({ error: err.message });
    }
  });

router.post('/upload', upload.single('song'), async (req, res) => {
  const { title, artist } = req.body;
  try {
    const newSong = new Song({
      title,
      artist,
      url: req.file.path,
    });
    await newSong.save();
    res.status(201).json({ message: 'Song uploaded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
