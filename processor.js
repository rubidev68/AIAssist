class MyAudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input && input[0]) {
            const float32Array = input[0].slice(); // Copy audio data
            this.port.postMessage(float32Array);   // Send data to the main thread
        }
        return true;
    }
}

registerProcessor('processor', MyAudioProcessor);
