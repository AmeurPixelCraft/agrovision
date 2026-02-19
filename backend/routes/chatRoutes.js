const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Note: SDK 0.24.x usually works with v1 internally, but if v1beta fails, we stick to standard strings.
const model = genAI.getGenerativeModel({
    model: "gemini-pro-latest",
    systemInstruction: `
You are AgroBot, a world-class AI agricultural consultant. Your mission is to provide expert-level, actionable, and scientific advice to farmers and agricultural enthusiasts.

Formatting & Style:
1. Tone: Highly professional, encouraging, and authoritative yet accessible.
2. Structure: Use clear sections with bold titles. Use bullet points for readability.
3. Emojis: Use relevant agricultural and indicator emojis to make the content engaging (e.g., 🌱, 🌾, 🚜, 💧, 📈, ⚠️, ✅, 🥔, 🍎, 🥦).
4. Content: Always provide specific varieties, technical measurements, or scientific reasoning when possible.
5. Scope: Answer ALL agriculture questions including crops, soil, climate, livestock, and tech.

Example response style:
"🌱 **Conseil de Culture**
Pour les sols sablonneux, je recommande la plantation de **Légumes-racines** comme les carottes. 🥕

💧 **Stratégie d'Irrigation**
Puisque le sol sablonneux draine rapidement, utilisez un système de **Goutte-à-goutte**... ✅"
`
});

// We keep this for logic check but the model now has it built-in
const SYSTEM_INSTRUCTION = "Professional Agricultural Expert";


// GET History
router.get('/history', async (req, res) => {
    try {
        const history = await Conversation.find().sort({ updatedAt: -1 }).select('title updatedAt');
        res.json(history);
    } catch (error) {
        console.error("History Error:", error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// GET Conversation
router.get('/:id', async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) return res.status(404).json({ error: 'Not found' });
        res.json(conversation);
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// DELETE Conversation
router.delete('/:id', async (req, res) => {
    console.log(`-> Deleting conversation: ${req.params.id}`);
    try {
        await Conversation.findByIdAndDelete(req.params.id);
        console.log(`✅ Deleted successfully: ${req.params.id}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`❌ Delete failed for ${req.params.id}:`, error);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST Message (DIRECT API FLOW)
router.post('/', async (req, res) => {
    console.log("-> Incoming request to /api/chat");
    const { message, conversationId } = req.body;

    if (!message) return res.status(400).json({ error: 'No message' });

    try {
        let conversation;
        let chatHistory = [];

        const isDbConnected = mongoose.connection.readyState === 1;

        if (isDbConnected && conversationId) {
            conversation = await Conversation.findById(conversationId);
            if (!conversation) return res.status(404).json({ error: 'Chat not found' });

            chatHistory = conversation.messages
                .filter(m => m.role !== 'system')
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }));
        } else if (isDbConnected) {
            conversation = new Conversation({
                title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
                messages: []
            });
        }

        if (isDbConnected) {
            conversation.messages.push({ role: 'user', content: message });
        }

        // Call External intelligence
        const chat = model.startChat({
            history: chatHistory,
            generationConfig: { maxOutputTokens: 2000 }
        });

        console.log("-> Calling Gemini API...");
        const result = await chat.sendMessage(message);
        const aiReply = result.response.text();
        console.log("-> Gemini responded successfully.");

        if (isDbConnected) {
            conversation.messages.push({ role: 'assistant', content: aiReply });
            await conversation.save();
        }

        res.json({
            reply: aiReply,
            conversationId: isDbConnected ? conversation._id : 'offline-session',
            conversationTitle: isDbConnected ? conversation.title : 'Offline Chat'
        });

    } catch (error) {
        console.error("!!! API ERROR:", error.message);
        res.status(500).json({
            error: "Service indisponible",
            message: "L'IA ne répond pas pour le moment. Vérifiez votre clé API ou quota."
        });
    }
});

module.exports = router;
