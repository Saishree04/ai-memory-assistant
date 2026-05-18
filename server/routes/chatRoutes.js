const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/chat
router.post("/chat", async (req, res) => {
  try {
    const { userId, message } = req.body;

    // Get AI response from Groq
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

    // Save to MongoDB
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

// GET /api/quiz
router.get("/quiz", async (req, res) => {
  const quiz = [
    { question: "What is AI?", answer: "Artificial Intelligence" },
    { question: "What is DBMS?", answer: "Database Management System" },
    { question: "What is RAM?", answer: "Random Access Memory" }
  ];
  res.json(quiz);
});

module.exports = router;
