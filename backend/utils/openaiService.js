import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure your .env is loaded
});

export const callGPT3Turbo = async (userMessage, history = []) => {
  try {
    const systemPrompt = {
      role: "system",
      content: `You are a helpful university chatbot for Jamhuriya University. 
      Answer only questions about clearance, payments, documents, graduation, and related departments.
      If the question is not relevant, politely decline. Detect which department the question relates to (finance, library, lab, faculty, examination).`,
    };

    const messages = [systemPrompt, ...history, { role: "user", content: userMessage }];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or gpt-4 / gpt-4o if allowed
      messages,
      temperature: 0.3,
    });

    const botReply = response.choices[0].message.content;
    return botReply;

  } catch (err) {
    console.error("❌ GPT API Error:", err.response?.data || err.message || err);
    return "I'm having trouble responding right now.";
  }
};
