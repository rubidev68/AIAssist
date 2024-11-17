let isUserInteracted = false;
let audioContext;
let mediaStream;
// Déterminer automatiquement le protocole WebSocket en fonction du protocole de la page
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.host;
const ws = new WebSocket(`${wsProtocol}//${wsHost}/api`);

ws.onopen = () => {
    //console.log("WebSocket connection established with the server.");

};

let audioBufferQueue = [];
let audioBufferSourceNode;
let isPlaying = false;

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = 'en-EN';

recognition.onresult = (event) => {
    const transcript = event.results[event.results.length - 1][0].transcript.trim();
    //console.log("Detected speech:", transcript);

    if (transcript.toLowerCase().includes("assist")) {
        //console.log("Activation keyword detected!");
        recognition.stop();
        openAIContainer();
    }
};



ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    //console.log("Message received from server:", data);
    updateAIOrderText('Speaking...');

    if (data.type === 'transcript') {
        //console.log("Transcript received from server:", data.content);
        updateAITranscriptText(data.content, true);
    } else if (data.type === 'audio') {
        //console.log("Audio data received from server for playback.");

        // Convert base64 to Blob
        const audioBlob = base64ToWav(data.content); // Convert PCM16 to WAV
        const audioUrl = URL.createObjectURL(audioBlob);

        fetch(audioUrl)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(decodedData => {
                audioBufferQueue.push(decodedData);
                playNextAudio();
            });
    } else if (data.type == "request"){
        //console.log("Request received from server");
        let result = eval(data.function + "()");
        //console.log("Function result:", result);
        ws.send(JSON.stringify({ type: 'function', call_id:data.call_id, content: result }));
        
    } else {
        //console.log("Unexpected message type received:", data.type);
    }
};

function playNextAudio() {
    if (isPlaying) {
        return;
    }
    else if (audioBufferQueue.length == 0) {
        //console.log("No audio data in the queue.");
        updateAIOrderText('Speak now...');
        startAudioProcessing();
        return;
    }

    isPlaying = true;
    const audioBuffer = audioBufferQueue.shift();

    if (!audioBufferSourceNode || audioBufferSourceNode.playbackState === audioBufferSourceNode.FINISHED_STATE) {
        audioBufferSourceNode = audioContext.createBufferSource();
        audioBufferSourceNode.buffer = audioBuffer;
        audioBufferSourceNode.connect(audioContext.destination);
        audioBufferSourceNode.start(0);
        audioBufferSourceNode.onended = () => {
            isPlaying = false;
            playNextAudio();
        };
    } else {
        const newBuffer = audioContext.createBuffer(
            1,
            audioBufferSourceNode.buffer.length + audioBuffer.length,
            audioContext.sampleRate
        );

        newBuffer.getChannelData(0).set(audioBufferSourceNode.buffer.getChannelData(0));
        newBuffer.getChannelData(0).set(audioBuffer.getChannelData(0), audioBufferSourceNode.buffer.length);

        audioBufferSourceNode.buffer = newBuffer;
    }
}

ws.onclose = () => {
    //console.log("WebSocket connection closed.");
};

ws.onerror = (error) => {
    console.error("WebSocket error:", error);
};

function floatTo16BitPCM(float32Array) {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
        let s = Math.max(-1, Math.min(1, float32Array[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
}

function base64EncodeAudio(float32Array) {
    const pcmData = floatTo16BitPCM(float32Array);
    let binary = '';
    const bytes = new Uint8Array(pcmData);
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    return btoa(binary);
}

function base64ToWav(base64Audio) {
    const binaryString = atob(base64Audio);
    const pcmData = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
        pcmData[i] = binaryString.charCodeAt(i);
    }

    // WAV file header for PCM16
    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    // RIFF chunk descriptor
    view.setUint32(0, 0x52494646, false); // "RIFF"
    view.setUint32(4, 36 + pcmData.length, true); // File size - 8
    view.setUint32(8, 0x57415645, false); // "WAVE"

    // FMT sub-chunk
    view.setUint32(12, 0x666d7420, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1 size (16 for PCM)
    view.setUint16(20, 1, true); // Audio format (1 for PCM)
    view.setUint16(22, 1, true); // Number of channels (1 for mono)
    view.setUint32(24, 24000, true); // Sample rate (24kHz)
    view.setUint32(28, 24000 * 2, true); // Byte rate (sampleRate * channels * bytesPerSample)
    view.setUint16(32, 2, true); // Block align (channels * bytesPerSample)
    view.setUint16(34, 16, true); // Bits per sample (16 bits)

    // DATA sub-chunk
    view.setUint32(36, 0x64617461, false); // "data"
    view.setUint32(40, pcmData.length, true); // Subchunk2 size

    // Concatenate WAV header and PCM data
    const wavBuffer = new Uint8Array(wavHeader.byteLength + pcmData.byteLength);
    wavBuffer.set(new Uint8Array(wavHeader), 0);
    wavBuffer.set(pcmData, wavHeader.byteLength);

    return new Blob([wavBuffer], { type: 'audio/wav' });
}

// Function to check microphone permissions
async function checkMicrophonePermissions() {
    try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
        //console.log("Microphone permission status:", permissionStatus.state);
        if (permissionStatus.state === 'denied') {
            alert("Microphone access is blocked. Please allow access in your browser settings.");
            return false;
        }
        return true;
    } catch (error) {
        console.warn("Could not check microphone permissions:", error);
        return true; // Assume permissions are fine if we can't check
    }
}

// Function to resample audio to 24000Hz
async function resampleAudio(audioBuffer, targetSampleRate) {
    const offlineContext = new OfflineAudioContext(1, audioBuffer.length * targetSampleRate / audioBuffer.sampleRate, targetSampleRate);
    const bufferSource = offlineContext.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.connect(offlineContext.destination);
    bufferSource.start(0);
    const renderedBuffer = await offlineContext.startRendering();
    return renderedBuffer;
}

// Function to start audio processing
async function startAudioProcessing() {
    //console.log('Speak button clicked, initializing audio context and stream...');
    isUserInteracted = true;

    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        //console.log("AudioContext successfully created.");
    }

    try {
        const hasPermission = await checkMicrophonePermissions();
        if (!hasPermission) return;

        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        //console.log('Microphone access successful. MediaStream:', mediaStream);

        const source = audioContext.createMediaStreamSource(mediaStream);

        // VAD parameters
        let silenceThreshold = 0.01; // Threshold for detecting silence
        let silenceDuration = 1000; // Time in milliseconds to detect silence
        let silenceStart = null;
        let audioBuffer = [];

        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = async (e) => {
            const float32Array = e.inputBuffer.getChannelData(0);

            // Calculate the root mean square (RMS) level to measure volume
            const rms = Math.sqrt(float32Array.reduce((sum, sample) => sum + sample * sample, 0) / float32Array.length);

            // Detect silence if RMS is below threshold
            if (rms < silenceThreshold) {
                if (silenceStart === null) {
                    silenceStart = Date.now(); // Start silence timer
                } else if (Date.now() - silenceStart > silenceDuration) {
                    //console.log("Silence detected. Stopping audio stream.");
                    mediaStream.getTracks().forEach(track => track.stop()); // Stop capturing audio
                    source.disconnect();
                    processor.disconnect();
                    isAudioStreamActive = false;

                    // Resample the recorded audio buffer to 24000Hz
                    let audioBufferToResample;
                    try{
                        audioBufferToResample = audioContext.createBuffer(1, audioBuffer.length, audioContext.sampleRate);
                    } catch (error){
                        console.error("User is not speaking.");
                        updateAIOrderText('Click button to start talking.');
                        try {
                            recognition.start();
                        } catch (error) {
                            
                        }
                        
                    }
                    audioBufferToResample.copyToChannel(new Float32Array(audioBuffer), 0);
                    const resampledBuffer = await resampleAudio(audioBufferToResample, 24000);

                    // Send the resampled audio buffer to the server
                    const float32Array = resampledBuffer.getChannelData(0);
                    const audioBase64 = base64EncodeAudio(float32Array);
                    ws.send(JSON.stringify({ type: 'audio', content: audioBase64 }));
                    //console.log("Resampled audio buffer sent to server.");
                    updateAIOrderText('Waiting for response...');
                    updateAITranscriptText("")
                }
            } else {
                silenceStart = null; // Reset silence timer if speaking
                audioBuffer.push(...float32Array); // Append audio data to buffer
                //console.log("Audio data added to buffer.");
            }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        //console.log("Audio processing with ScriptProcessorNode started.");

    } catch (error) {
        if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
            console.error("Microphone permission was denied or request was aborted.");
            alert("Please allow microphone access to use this feature.");
        } else {
            console.error("Unexpected error initializing audio:", error);
        }
    }
}
