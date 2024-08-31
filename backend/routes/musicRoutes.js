const express = require('express');
const multer = require('multer');
const path = require('path');
const Music = require('../models/Music');
const router = express.Router();

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/music');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Upload music file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, artist } = req.body;
    const filePath = req.file.path;
    const music = new Music({ title, artist, filePath });
    await music.save();
    res.status(201).json({ message: 'Music uploaded successfully', music });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error uploading music', error });
  }
});

// Get all music files
router.get('/', async (req, res) => {
  try {
    const music = await Music.find();
    res.status(200).json(music);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching music', error });
  }
});

module.exports = router;
