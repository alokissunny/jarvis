// azure-cognitiveservices-speech.js



const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: "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" //process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


require('dotenv').config()
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const blendShapeNames = require('./blendshapeNames');
const _ = require('lodash');


async function generateText(prompt) {
    try {
        console.log('calling open ai with key', process.env.OPENAI_API_KEY);
        if (!configuration.apiKey) {
           console.log("OpenAI API key not configured, please follow instructions in README.md");
            return;
          }
        const response = await openai.createCompletion({
            model: "text-curie-001",
            prompt: "explain to a second grader\n ", prompt,
            temperature: 0.7,
            max_tokens: 256,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
          });      
           console.log('response open ai',response);
       parseResponse(response);
       return response;
    } catch (error) {
        console.error(error);
    }
}
function parseResponse(response) {
    console.log(`Generated text: ${response.data.choices[0].text}`);
    // console.log(`Tokens: ${response.choices[0].tokens}`);
    // console.log(`Completion: ${response.choices[0].completions}`);
    // console.log(`Probabilities: ${response.choices[0].probabilities}`);
    // console.log(`Log probabilities: ${response.choices[0].log_probs}`);
}

// let SSML = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="hi-IN">
// <voice name="hi-IN-MadhurNeural">
//   <mstts:viseme type="FacialExpression"/>
//   __TEXT__
// </voice>
// </speak>`;
let SSML = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
<voice name="en-US-JennyNeural">
  <mstts:viseme type="FacialExpression"/>
  __TEXT__
</voice>
</speak>`;

const key = process.env.AZURE_KEY;
const region = process.env.AZURE_REGION;
        
/**
 * Node.js server code to convert text to speech
 * @returns stream
 * @param {*} key your resource key
 * @param {*} region your resource region
 * @param {*} text text to convert to audio/speech
 * @param {*} filename optional - best for long text - temp file for converted speech/audio
 */
const textToSpeech = async (text, voice)=> {
    
    // convert callback function to promise
    return new Promise(async (resolve, reject) => {
        
        let res = await generateText(text);
        let ssml = SSML.replace("__TEXT__", res.data.choices[0].text);

        
        const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
        speechConfig.speechSynthesisOutputFormat = 5; // mp3
        speechConfig.speechSynthesisVoiceName = "hi-IN-MadhurNeural";
        
        let audioConfig = null;
        
        // if (filename) {
        let randomString = Math.random().toString(36).slice(2, 7);
        let filename = `./public/speech-${randomString}.mp3`;
        audioConfig = sdk.AudioConfig.fromAudioFileOutput(filename);
        // }

        let blendData = [];
        let timeStep = 1/60;
        let timeStamp = 0;
         const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
    //     var audioFile = "YourAudioFile.mp3";
    // // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
    // const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_KEY, process.env.AZURE_REGION);
    // speechConfig.speechSynthesisOutputFormat = 5;
    // const audioConfig = sdk.AudioConfig.fromAudioFileOutput(audioFile);

    // // The language of the voice that speaks.
    // speechConfig.speechSynthesisVoiceName = "hi-IN-MadhurNeural"; 

    // // Create the speech synthesizer.
    // var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

        // Subscribes to viseme received event
        synthesizer.visemeReceived = function (s, e) {

            // `Animation` is an xml string for SVG or a json string for blend shapes
            var animation = JSON.parse(e.animation);
            console.log('visemeReceived');
            _.each(animation.BlendShapes, blendArray => {
                console.log('visemeReceived  ....');
                let blend = {};
                _.each(blendShapeNames, (shapeName, i) => {
                    blend[shapeName] = blendArray[i];
                });
        
                blendData.push({
                    time: timeStamp,
                    blendshapes: blend
                });
                timeStamp += timeStep;
            });

        }

        synthesizer.speakSsmlAsync(
            ssml,
            result => {
                
                synthesizer.close();
                resolve({blendData, filename: `/speech-${randomString}.mp3`});

            },
            error => {
                synthesizer.close();
                reject(error);
            }); 
    });
};

module.exports = textToSpeech;