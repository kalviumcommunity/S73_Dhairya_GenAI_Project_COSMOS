import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const systemPrompt = fs.readFileSync(
  path.join("src", "prompts", "systemPrompt.txt"),
  "utf8"
);

router.post("/ask", async (req, res) => {
  try {
    const { query } = req.body;
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }],
        },
      ],
    });

    res.json({ answer: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
