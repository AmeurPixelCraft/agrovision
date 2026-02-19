require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        const models = await genAI.listModels();
        console.log("Available models:");
        models.forEach(m => console.log(m.name));
    } catch (e) {
        console.error("Error listing models:", e.message);
    }
}

run();
