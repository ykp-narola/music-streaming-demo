const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    status: { 
        type: String,
        enum: ["active", "inactive"],
        default: "inactive",
        required: true
    },
    room: { 
        type: String, 
        required: true
    },
    mode: { 
        type: String, 
        required: true, 
        enum: ["meeting", "broadcast"], 
        default: "meeting",
    },
    createdBy: { type: String }
}, { timestamps: true })

const meeting = mongoose.model("Meeting", meetingSchema)

module.exports = meeting