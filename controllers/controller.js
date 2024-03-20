const twiml = require("twilio").twiml;
const axios = require("axios");
const util = require("../util/saveChat");

const baseUrl = "https://cef1-110-235-219-228.ngrok-free.app";
// const baseUrl = "https:/localhost:8000";
const url = `${baseUrl}/api/run-agent/indic_prompt_agent/`;
const genDetailUrl = `${baseUrl}/api/run-agent/get_personal_info/`;
const INITIAL_MESSAGE = "Hello, how may I help you";

// This function handles incoming requests
const incoming = async (req, res) => {
    try {
        const voiceResponse = new twiml.VoiceResponse();

        // If there are no cookies or message in the cookies, say the initial message
        if (!req.cookies || !req.cookies.msg) {
            voiceResponse.say(INITIAL_MESSAGE);
            console.log(`assistant: ${INITIAL_MESSAGE}`);
        }

        // Check if there is an id cookie, if not initialize a chat and set the id cookie
        if (req.cookies.id) {
            res.cookie("id", req.cookies.id);
        } else {
            const id = await util.initializeChat(INITIAL_MESSAGE);
            res.cookie("id", id);
        }

        // Gather speech input from the user
        voiceResponse.gather({
            input: ["speech"],
            speechTimeout: "auto",
            speechModel: "experimental_conversations",
            enhanced: true,
            language: "hi-IN",
            action: "/api/v1/respond",
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
        res.cookie("id", id);

        function checkString(inputStr) {
            var lowerCaseStr = inputStr.toLowerCase();
            return (
                lowerCaseStr.includes("bye") || lowerCaseStr.includes("ओक बाई")
            );
        }

        const endCheck = checkString(voiceInput);

        // Save the chat if there is voice input or output
        if (voiceInput) {
            await util.saveChat({ role: "user", message: voiceInput }, id);
            console.log(`user: ${voiceInput}`);
        }

        // Create a new voice response with the output and redirect to incoming-call
        const voiceResponse = new twiml.VoiceResponse();
        if (endCheck) {
            voiceResponse.say("Have a great gay");
            voiceResponse.redirect({ method: "GET" }, "/api/v1/appointment");
            res.set("Content-Type", "application/xml");
            res.send(voiceResponse.toString());
            voiceResponse.hangup();
        } else {
            // Post the voice input to a URL and get the response
            const { data } = await axios.post(
                `${url}${id}`,
                { prompt: voiceInput },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            // // Extract the output from the response data
            const output = data[0].Answer;
            // const output = voiceInput;

            // Set cookies for message and id
            res.cookie("msg", output);

            voiceResponse.say(output);
            voiceResponse.redirect({ method: "POST" }, "/api/v1/incoming-call");
            // Set the response content type and send the voice response
            res.set("Content-Type", "application/xml");
            res.send(voiceResponse.toString());
            if (output) {
                await util.saveChat({ role: "assistant", message: output }, id);
                console.log(`assistant: ${output}`);
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getChat = async (req, res) => {
    const data = await util.getChatHistory(req.query.id);
    res.status(200).json({ data });
};

const getAppointmentData = async (req, res) => {
    try {
        const id = req.cookies.id;
        const { data } = await axios.get(`${genDetailUrl}${id}`, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        console.log(data);
        res.status(200).json({ success: trie });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { incoming, response, getChat, getAppointmentData };
