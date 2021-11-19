class bufferProcessor extends AudioWorkletProcessor {
    constructor (options) {
        super();
        this._frameSize = 128;
        this._bufferSize = options.processorOptions.bufferSize; //4096 or your choice

        // Set initial arguments
        this._buffer = []; //empty buffer, length 4096
    }
    
    // reference : https://stackoverflow.com/questions/63669376/buffersize-in-audioworklet-program-results-in-glitchy-sound
    _inputProcess(data) { 
        for (let i = 0; i < this._frameSize; i++) {
            this._buffer.push(data[i]); //input data
        }
        // console.log(this._buffer.length);
        if (this._buffer.length >= this._bufferSize){
            this._sendMessege("PROCESSED_DATA", this._buffer);
        }
    }

    _sendMessege(message, buffer=null){
        if(!message){
            return;
        }
        
        let output = new Float32Array(this._bufferSize);
        for (let i = 0; i < buffer.length; i++){
            output[i] = buffer[i];
        }

        this._buffer = [];
        this.port.postMessage({message, output})
    }

    // the process method is required - output silence,
    // which the outputs are already filled with
    process (inputs, outputs, parameters) {
        // console.log(inputs) // Current buffer size = 128 
        // buffer.push(inputs[0]);
        if(!(inputs[0][0]) instanceof Float32Array){
            return true;
        }// if not input type is Float32Array, then return.

        // We need only 1 channel.
        // this._inputProcess(inputs[0]);
        // console.log(inputs[0][0]);
        this._inputProcess(inputs[0][0]) // inputs[0][0] = [0, 0, 0.00232..., -0.323..., etc...]
        return true;
    }
}
registerProcessor('processor', bufferProcessor)