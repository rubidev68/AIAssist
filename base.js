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
expressWs(app);

// PCM encoding function
const floatTo16BitPCM = (float32Array) => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
};

app.get('/', (req, res) => res.sendFile("index.html", { root: __dirname }));
app.ws('/api', (ws) => {
    console.log("Client connected to WebSocket /api endpoint.");

    const openAIWs = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01', {
        headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "realtime=v1",
        },
    });

    let audioBuffer = [];

    openAIWs.on('open', () => {
        console.log("Connected to OpenAI Realtime API.");
        openAIWs.send(JSON.stringify({
            type: "session.update",
            session: { input_audio_transcription: { model: "whisper-1" } },
        }));
    });

    openAIWs.on('message', (data) => {
        const response = JSON.parse(data.toString());
        if (response.type === 'response.audio_transcript.done') {
            ws.send(JSON.stringify({ type: 'transcript', content: response.transcript }));
        } else if (response.type === 'response.audio.delta') {
            ws.send(JSON.stringify({ type: 'audio', content: response.delta }));
        } else if (response.type === 'response.done') {
            audioBuffer = []; // Clear buffer when the response is done
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

        openAIWs.send(JSON.stringify(event));
    });
});

app.listen(3000, () => console.log('Server is running on http://localhost:3000'));
