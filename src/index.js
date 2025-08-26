const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Load RTFC-based system prompt
const systemPrompt = fs.readFileSync(
  path.join("src", "prompts", "systemPrompt.txt"),
  "utf8"
);

async function askQuestion(query) {
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nUser Question: ${query}`,
            },
          ],
        },
      ],
    });

    console.log("\n🌌 SpaceSense Answer:");
    console.log(result.response.text());
  } catch (err) {
    console.error("❌ Error while generating response:", err);
  }
}

// Run from CLI
const query = process.argv.slice(2).join(" ");
if (!query) {
  console.log("⚠️ Please provide a space-related question.");
  console.log("👉 Example: node src/index.js 'What is a black hole?'");
  process.exit(1);
}

askQuestion(query);
