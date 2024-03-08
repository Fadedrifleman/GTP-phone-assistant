const twiml = require("twilio").twiml;
const axios = require("axios");
const util = require("../util/saveChat");

const url = "http://localhost:8000/api/run-agent/prompt_agent";
const INITIAL_MESSAGE = "Hello, how may I help you";

// This function handles incoming requests
const incoming = async (req, res) => {
    try {
        const voiceResponse = new twiml.VoiceResponse();

        // If there are no cookies or message in the cookies, say the initial message
        if (!req.cookies || !req.cookies.msg) {
            voiceResponse.say(INITIAL_MESSAGE);
        }

        // Check if there is an id cookie, if not initialize a chat and set the id cookie
        if (req.cookies.id) {
            res.cookie("id", req.cookies.id);
        } else {
            const id = await helper.initializeChat(INITIAL_MESSAGE);
            res.cookie("id", id);
        }

        // Gather speech input from the user
        voiceResponse.gather({
            input: ["speech"],
            speechTimeout: "auto",
            speechModel: "experimental_conversations",
            enhanced: true,
            action: "/respond",
        });

        // Set the response content type and send the voice response
        res.set("Content-Type", "application/xml");
        res.send(voiceResponse.toString());
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// This function handles the response
const response = async (req, res) => {
    try {
        // Extract the voice input from the request body
        const voiceInput = req.body.SpeechResult;
        const id = req.cookies.id;

        // Post the voice input to a URL and get the response
        const { data } = await axios.post(
            url,
            { prompt: voiceInput },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        // Extract the output from the response data
        const output = data[0].Answer;

        // Set cookies for message and id
        res.cookie("msg", voiceInput);
        res.cookie("id", id);

        // Create a new voice response with the output and redirect to incoming-call
        const voiceResponse = new twiml.VoiceResponse();
        voiceResponse.say(output);
        voiceResponse.redirect({ method: "POST" }, "/incoming-call");

        // Set the response content type and send the voice response
        res.set("Content-Type", "application/xml");
        res.send(voiceResponse.toString());

        // Save the chat if there is voice input or output
        if (voiceInput) {
            await util.saveChat({ role: "user", message: voiceInput }, id);
        }
        if (output) {
            await util.saveChat({ role: "assistant", message: output }, id);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { incoming, response };
