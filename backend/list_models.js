require('dotenv').config();

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        if (data.models) {
            const textModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
            textModels.forEach(m => console.log(m.name));
        } else {
            console.log(JSON.stringify(data));
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
