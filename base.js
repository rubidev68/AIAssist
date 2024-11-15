// Required imports
import fs from 'fs';
import WebSocket from 'ws';
import express from 'express';
import expressWs from 'express-ws';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use("/", express.static(path.join(__dirname, 'public')));
expressWs(app);

// WebSocket server setup
app.get('/', (req, res) => res.sendFile("./index.html", { root: __dirname }));
app.ws('/api', (ws) => {
    console.log("Client connected to WebSocket /api endpoint.");

    // Connection to OpenAI's Realtime API
    const openAIWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
        headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "realtime=v1",
        },
    });

    let audioChunks = [];

    openAIWs.on('open', () => {
        console.log("Connected to OpenAI Realtime API.");
        
    });

    openAIWs.on('message', (data) => {
        const response = JSON.parse(data.toString());

        if (response.type === 'response.audio_transcript.delta') {
            ws.send(JSON.stringify({ type: 'transcript', content: response.delta }));
        } else if (response.type === 'response.audio.delta') {
            console.log(response);
            // Stream each delta audio chunk to the client immediately
            ws.send(JSON.stringify({ type: 'audio', content: response.delta.toString() }));
        } else if (response.type === 'response.done' && response.response.status === 'completed') {
            console.log("Response streaming completed.");
            audioChunks = []; // Clear buffer for next response if needed
        } else {
            console.log(response);
        }
    });


    ws.on('message', (message) => {

        const event = {
            type: 'conversation.item.create',
            item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_audio', audio: message }]
            }
        };
        console.log("Sending message to OpenAI Realtime API.");
        openAIWs.send(JSON.stringify(event));
        openAIWs.send(JSON.stringify({ type: 'response.create' }));
    });
});

app.listen(3000, () => console.log('Server is running on http://localhost:3000'));
