const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/chat
router.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an AI Student Memory Assistant. Help students understand and remember concepts clearly and simply."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const response = completion.choices[0].message.content;

    const newChat = new Chat({ userId, message, response });
    await newChat.save();

    res.status(201).json({ success: true, userMessage: message, aiResponse: response });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/history/:userId
router.get("/history/:userId", async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.params.userId });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quiz/:userId
router.get("/quiz/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get last 5 chats of this student
    const recentChats = await Chat.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    // If no chats found return default questions
    if (recentChats.length === 0) {
      return res.json([
        { question: "What is AI?", answer: "Artificial Intelligence" },
        { question: "What is Machine Learning?", answer: "AI that learns from data" },
        { question: "What is a Database?", answer: "Organized collection of data" },
        { question: "What is an API?", answer: "Application Programming Interface" },
        { question: "What is Cloud Computing?", answer: "Storing data over the internet" }
      ]);
    }

    // Generate quiz from their actual study topics using Groq AI
    const topics = recentChats.map(c => c.message).join(", ");

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Based on these topics a student studied: ${topics}
          
Generate exactly 5 quiz questions in this exact JSON format only, no extra text, no markdown:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]`
        }
      ]
    });

    const text = completion.choices[0].message.content;
    
    // Clean the response and parse JSON
    const clean = text.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(clean);
    
    res.json(questions);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;