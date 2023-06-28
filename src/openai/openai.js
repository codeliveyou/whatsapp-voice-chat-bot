import dotenv from 'dotenv'
import { Configuration, OpenAIApi } from 'openai'
dotenv.config()
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const conversationHistory = new Map();

const getGptResponse = async (clientText, sender) => {
    try {
      let messages = conversationHistory.get(sender) || [
        { role: "system", content: process.env.START_PROMPT },
      ];
      messages.push({ role: "user", content: clientText });
      const body = {
        model: "gpt-3.5-turbo",
        messages: messages,
      };
      const completion = await openai.createChatCompletion(body)
      const response = completion.data.choices[0].message.content;
      messages.push({ role: "assistant", content: response });
      conversationHistory.set(sender, messages);
      return response;
    } catch (e) {
      return `❌ OpenAI Response Error ❌\n${e.message}`;
    }
};
const getDalleResponse = async (clientText) => {
    const body = {
        prompt: clientText,
        n: 1,
        size: "1024x1024",
    };

    try {
        const { data } = await openai.createImage(body)
        return data.data[0].url;
    } catch (e) {
        return `❌ OpenAI Response Error ❌`;
    }
};
export default {
    getGptResponse,
    getDalleResponse,
    conversationHistory
}