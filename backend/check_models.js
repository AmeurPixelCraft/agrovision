require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        // The Gemini API exposes listModels on the GenerativeModel or via the main instance depending on SDK version?
        // Actually with the current SDK it's distinct. Let's try to just fetch a model we suspect works, or use a known fallback.
        // But typically we can't 'list' easily without the right method.
        // Actually, looking at docs, genAI usually doesn't have listModels directly exposed in the high-level helper 
        // in all versions, but let's try a standard model that DEFINITELY exists.

        // 'gemini-1.0-pro' is often the stable v1 name.
        console.log("Checking gemini-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Test");
        console.log("gemini-pro worked!");
    } catch (error) {
        console.log("gemini-pro failed:", error.message);
    }

    try {
        console.log("Checking gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Test");
        console.log("gemini-1.5-flash worked!");
    } catch (error) {
        console.log("gemini-1.5-flash failed:", error.message);
    }
}

listModels();
