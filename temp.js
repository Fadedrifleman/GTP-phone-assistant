const express = require("express");
const twiml = require("twilio").twiml;
const axios = require("axios");
const bodyParser = require("body-parser");
const morgan = require("morgan");
var cookieParser = require("cookie-parser");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(cookieParser());

// recovery code : BDWU6YC8FD2VQU18R568FY41
const url = "http://localhost:8000/api/run-agent/prompt_agent";
const INITIAL_MESSAGE = "Hello, how may I help you";

app.post("/incoming-call", async (req, res) => {
    const voiceResponse = new twiml.VoiceResponse();
    if (!req.cookies || !req.cookies.msg) {
        voiceResponse.say(INITIAL_MESSAGE);
    }
    voiceResponse.gather({
        input: ["speech"],
        speechTimeout: "auto",
        speechModel: "experimental_conversations",
        enhanced: true,
        action: "/respond",
    });

    res.set("Content-Type", "application/xml");
    return res.send(voiceResponse.toString());
});

app.post("/respond", async (req, res) => {
    const voiceInput = req.body.SpeechResult;
    console.log(voiceInput);

    const response = await axios.post(
        url,
        { prompt: voiceInput },
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
    const aiResponse = response.data[0];
    const output = aiResponse.Answer;

    res.cookie("msg", voiceInput);

    const voiceResponse = new twiml.VoiceResponse();
    voiceResponse.say(output);
    voiceResponse.redirect({ method: "POST" }, "/incoming-call");

    res.set("Content-Type", "application/xml");
    return res.send(voiceResponse.toString());
});

app.get("/test", async (req, res) => {
    return res.status(200).json({ t: "Test" });
});

const port = 3000;
console.log(`Server is running on port ${port}`);

app.listen(port);
