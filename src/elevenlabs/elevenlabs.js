import axios from "axios";
import fs from 'fs';

const elevenLabsKey = '';

// "fileName" is the path of the audio or media file to be converted to text.
// "voicdID" is the name of model of bot.
const getElevenlabsResponse = async (Text, fileName, voiceId, elevenLabsLatency) => {
    console.log('Input Message = ' + Text);
    const response = await axios.post(
        'https://api.elevenlabs.io/v1/text-to-speech/' + voiceId + '/stream?optimize_streaming_latency=' + elevenLabsLatency,
        {
            text: Text,
            voice_settings: {
                stability: 0,
                similarity_boost: 0
            }
        },
        {
            headers: {
                'Accept': 'audio/mpeg',
                'xi-api-key': elevenLabsKey,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer' // Set the response type to arraybuffer
        }
    );

    // Save the response to a file
    fs.writeFileSync(fileName, response.data);
};

export default {
    getElevenlabsResponse
}