const Meeting = require('../models/Meeting');


exports.list = async (req, res) => {
  const { query } = req.body;
  try {
    const meeting = await Meeting.findOne(query);
    res.status(201).json({ message: 'Meeting find successfully', data: meeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
