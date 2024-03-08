const mongoose = require("mongoose");

const chatModel = new mongoose.Schema(
    {
        chat: [
            {
                role: String,
                message: String,
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Chat", chatModel);
