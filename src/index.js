
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.0-flash" });

// Load RTFC-based system prompt
const systemPrompt = fs.readFileSync(
  path.join(__dirname, "prompts", "systemPrompt.txt"),
  "utf8"
);

app.post('/api/explain', async (req, res) => {
  const { term } = req.body;
  if (!term) return res.status(400).json({ error: 'Missing term' });
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nUser Question: ${term}`,
            },
          ],
        },
      ],
    });
    res.json({ prompt: `${systemPrompt}\n\nUser Question: ${term}`, aiText: result.response.text() });
  } catch (err) {
    console.error("Error while generating response:", err);
    res.status(500).json({ error: 'Gemini API error', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`COSMOS backend running on port ${PORT}`);
});
