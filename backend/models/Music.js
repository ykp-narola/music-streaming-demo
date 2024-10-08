const mongoose = require('mongoose');

const musicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  filePath: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId}
}, { timestamps: true });

const Music = mongoose.model('Music', musicSchema);

module.exports = Music;
