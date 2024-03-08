const model = require("../models/models");

// This function saves a chat message to the database
const saveChat = async ({ role, message }, id) => {
    try {
        // Find the chat document by ID
        const doc = await model.Chat.findById(id);

        // Push the new message into the chat array
        doc.chat.push({ role, message });

        // Save the updated document
        await doc.save();
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// This function initializes a new chat in the database
const initializeChat = async (msg) => {
    try {
        // Create a new chat document with an initial assistant message
        const doc = await model.Chat.create({
            chat: [{ role: "assistant", message: msg }],
        });

        // Return the ID of the new document
        return doc._id;
    } catch (error) {
        console.error(error);
        throw error;
    }
};
module.exports = { saveChat, initializeChat };
