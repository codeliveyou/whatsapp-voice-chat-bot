import whats from 'whatsapp-web.js'
const { MessageMedia } = whats;
import qrcode from 'qrcode-terminal';
import { deleteContent } from './utils/delete.js';
import fs from 'fs'
import transcript from './openai/transcript.js';
import path from 'path';
import callApi from './openai/openai.js';
import { getBardResponse } from './bard/bard.js';
import elevenlabsResponse from './elevenlabs/elevenlabs.js'

console.log("success");

const client = new whats.Client({
    authStrategy: new whats.LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true})
});

client.on('authenticated', (session) => console.log(`Authenticated`));

client.on('ready', () => {
    console.log('ChatGPT is ready.')
});

client.on('message_create', message => commands(message));

client.initialize();

const userInfo = {};

    // 15407265280
    // 13476321824 /pedro
    // 353864117131 /matteo
    // 13147202107 /iamai
    // 17046725758 /leo

const allowedUsers = new Set(["13147202107"]);

const greetings = `🙋‍♂ Hello there! I'm Adrian, your digital companion specialized in guiding you through love, education, and sexual exploration! 🌹📚💋 Now, let's make our chat more personalized.

To begin, let's pick our method of communication. We have two alternatives:
📜 Option 1: Text Interaction - You can send me text or voice messages, and I'll reply in text form.
🗣 Option 2: Vocal Interaction - You can send me text or voice messages, and I'll reply vocally.

⚠ Please note that my vocal responses are not available in all languages yet.

Please reply with the number of your chosen option. `;

const selectingVoice = `Fantastic choice! Now, let's customize my voice further. 🎙

Would you prefer a male or female voice for my responses? You can always adjust this setting later if you wish.

Please respond with 'male' or 'female'. 👤`;

const invalidAccountResponse = `Sorry, you are not authorized to use this chatbot.
If you have any questions about the use of this, please call XXX.
Thank you.`;


const modes = ["mode 1", "mode 2"];
const varientOfModes = {
    "mode 1" : ["One.", "One", "one.", "one", "1.", "1", "Mode 1.", "Mode 1", "Mode one.", "Mode one"],
    "mode 2" : ["Two.", "Two", "two.", "two", "2.", "2", "Mode 2.", "Mode 2", "Mode two.", "Mode two"]
};

const genders = ["male","female"];
const VariantsOfGender = {
    "male" : ["Male", "Male.", "male", "male.", "Mail", "Mail.", "mail", "mail."],
    "female" : ["Female", "Female.", "female", "female."]
};

const voices = {"male" : "yOBVvh7orSUQ0dxm0hOX", "female" : "60cNlr6ZVk5wdXqvmnV5", "base" : "TxGEqnHWrfWFTfGW9XjX"};


const commands = async (message) => {
    if (message.from.includes(process.env.PHONE_NUMBER)) return;
    const contact = await message.getContact();
    const sender = message.from.includes(process.env.PHONE_NUMBER) ? message.to : message.from;

    // Determines whether the user is authorized to use ALEX.
    if (allowedUsers.size > 0 && allowedUsers.has(sender.split('@')[0]) == false) {
        console.log("This is invalid account");
        // client.sendMessage(sender, invalidAccountResponse, { mentions: [contact] });
        return;
    }

    let clientMessage = ""

    // If the message contains audio or video, convert it to mp3 audio file.
    // Convert it to text using whispers.
    if (message.hasMedia) {
        console.log("This message has Media");

        const media = await message.downloadMedia();
        if (!media || !media.mimetype.startsWith("audio/")) return;
        
        console.log('Audio received.: ' + sender);
        const audioFilesDir = path.join('./src/', 'audio_files');
        if (!fs.existsSync(audioFilesDir)) {
            fs.mkdirSync(audioFilesDir);
        }
        
        const inputPath = path.join(audioFilesDir, `${message.id._serialized}.ogg`);
        const outputPath = path.join(audioFilesDir, `${message.id._serialized}.mp3`);
        fs.writeFileSync(inputPath, media.data, { encoding: 'base64' });
        
        try {
            await transcript.convertAudioToMp3(inputPath, outputPath);
            console.log('Áudio convertion to MP3 sucesso!');
            
            const res = await transcript.sendAudioForTranscription(outputPath);
            
            clientMessage = res;

            console.log("~~ The recognised text by Whisper is -> " + clientMessage);

            deleteContent('./src/audio_files/');
        } catch (err) {
            console.log('Error in converstion the audio:', err);
        }
    }
    else {
        clientMessage = message.body;
    }
    
    // If the user is not registered, the state is initialized.
    if ((sender in userInfo) == false) {
        console.log("This is new user.");
        client.sendMessage(sender, greetings, { mentions: [contact]});
        userInfo[sender] = {
            "mode" : "mode 1",
            "currentStage" : "begin",
            "voice_id" : "base",
            "elevenLabsLatency" : 3,
        };
        return;
    }

    console.log('message recieved from: ' + sender );
    const iaCommands = {
        dalle: "!dalle",
        reset: "!reset",
        bard: "!bard",
    };

    let botMessage = ""

    console.log("~-> The Client's Message is -> " + clientMessage);

    let settingOption = false;

    switch(clientMessage.split(' ')[0]) {
        case iaCommands.dalle:
            const imgDescription = clientMessage.substring(6);
            client.sendMessage(sender, 'Generating an image...', { mentions: [contact] });
            callApi.getDalleResponse(imgDescription, message).then(async (imgUrl)  => {
                const media = await whats.MessageMedia.fromUrl(imgUrl);
    // If you want to send it as a sticker, add in options -> sendMediaAsSticker: true.
                const options = {
                    mentions: [contact],
                    media: media
                };
                await client.sendMessage(sender, media, options);
            });
            return;

        case iaCommands.reset:
            callApi.conversationHistory.delete(sender);
            client.sendMessage(sender, 'conversation reset.', { mentions: [contact] });
            if (sender in userInfo) {
                delete userInfo[sender];
            }
            return;

        case iaCommands.bard:
            const bardPrompt = clientMessage.substring(5);
            const resp = await getBardResponse(bardPrompt)
            client.sendMessage(sender, '...', { mentions: [contact] });
            client.sendMessage(sender, resp, { mentions: [contact] });
            botMessage = response;
            return;

        default:
            switch (userInfo[sender]["currentStage"]) {
                // Encourage users to choose voice or text method.
                case "begin":{
                    settingOption = true;
                    if (varientOfModes["mode 1"].includes(clientMessage)) {
                        userInfo[sender]["mode"] = "mode 1";
                        userInfo[sender]["currentStage"] = "end";
                        botMessage = "Great. Then I will respond via text message.\nJust talk to me how can I help?";
                    }
                    else if (varientOfModes["mode 2"].includes(clientMessage)) {
                        userInfo[sender]["mode"] = "mode 2";
                        userInfo[sender]["currentStage"] = "settingBotGender";

                        botMessage = selectingVoice;

                    }
                    else {
                        botMessage = "Just write '1' or '2'. What's your choice? 👤";
                    }
                    break;
                }
                // When the user selects a voice method, it is recommended that the user select the voice gender.
                case "settingBotGender":{
                    for(let i = 0; i < 2; i ++) {
                        
                        if (VariantsOfGender[genders[i]].includes(clientMessage)) {
                            
                            botMessage = `Very nice!\nJust talk to me how can I help?`;
                            
                            userInfo[sender]["voice_id"] = genders[i];
                            
                            userInfo[sender]["currentStage"] = "end";
                            break;
                        }
                    }
                    if (botMessage == "") {
                        settingOption = true;
                        botMessage = `Just write 'male' or 'female'. What's your choice? 👤`;
                    }
                    break;
                }
                // If it is not a bot setting option, a response is generated by GPT.
                default:{
                    try {
                        const response = await callApi.getGptResponse(clientMessage, sender);
                        botMessage = response;
                    } catch (error) {
                        console.error(error);
                    }
                    break;
                }
            }

            // If the user selects voice mode, it will answer with a voice.
            if (userInfo[sender]["mode"] == "mode 2" && settingOption == false) {
                client.sendMessage(sender, '...', { mentions: [contact] });

                const date = new Date();
                let fileName = `./src/audio_files/${sender}${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}.mp3`;

                console.log("current bot's voice is " + userInfo[sender]["voice_id"]);
                await elevenlabsResponse.getElevenlabsResponse(botMessage, fileName, voices[userInfo[sender]["voice_id"]], 3);

                let file = fs.readFileSync(fileName);
                let media = new MessageMedia('audio/mp3', file.toString('base64'));
                client.sendMessage(sender, media);
                deleteContent('./src/audio_files/');
            }
            // Respond textually.
            else {
                client.sendMessage(sender, botMessage, { mentions: [contact]});
            }

            break;
    }


};