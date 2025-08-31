// Load env and imports
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const { getDynamicPrompt } = require("./prompts/dynamic");

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// --- Express API Route ---
// This must come BEFORE express.static
app.post("/api/prompt", async (req, res) => {
  const { prompt, promptType } = req.body;
  if (!prompt || !promptType) {
    return res.status(400).json({ error: "Missing prompt or promptType" });
  }

  try {
    const fullPrompt = getPrompt(promptType, prompt);
    const aiText = await generate(fullPrompt);
    res.json({ response: aiText });
  } catch (err) {
    res.status(500).json({ error: "API error", details: err.message });
  }
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Gets the full prompt string based on the selected type and user query.
 * @param {string} promptType - The type of prompt (e.g., 'zeroShot', 'dynamic').
 * @param {string} query - The user's input query.
 * @returns {string} The fully constructed prompt.
 */
function getPrompt(promptType, query) {
  if (promptType === "dynamic") {
    // Dynamic prompt has its own logic
    return getDynamicPrompt(query);
  }
  const fileName = `${promptType}.txt`;
  const filePath = path.join(__dirname, "prompts", fileName);
  try {
    const template = fs.readFileSync(filePath, "utf8");
    return template.replace("${user_query}", query);
  } catch (error) {
    console.error(`Error loading prompt file: ${fileName}`, error);
    // Fallback to a simple prompt if file is missing
    return `User Question: ${query}`;
  }
}

/**
 * Generates content using the Gemini model.
 * @param {string} prompt - The full prompt to send to the model.
 * @returns {Promise<string>} The generated text from the model.
 */
async function generate(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error while generating response:", error);
    throw new Error("Failed to generate content from Gemini API.");
  }
}

// --- CLI Runner ---
async function runCli() {
  const args = process.argv.slice(2);
  // No need to check for args length here as it's done in the startup logic
  
  if (args.length < 2) {
    console.log("Usage: node src/index.js <promptType> <question>");
    process.exit(1);
  }

  const mode = args[0];
  const query = args.slice(1).join(" "); // Correctly join all subsequent args for the query

  try {
      const finalPrompt = getPrompt(mode, query);
      console.log(`--- Running CLI with mode: ${mode} ---`);
      console.log(`--- Prompt --- \n${finalPrompt}\n--- End Prompt ---`);
      const result = await generate(finalPrompt);
      console.log("\n🌌 Answer:");
      console.log(result);
  } catch (err) {
    console.error("⚠️ Error in CLI:", err.message);
  }
}

// --- Application Startup Logic ---
if (require.main === module) {
    // Check if command-line arguments are present.
    // The first two args are 'node' and the script path.
    if (process.argv.length > 2) {
        // If args exist, run the CLI.
        runCli();
    } else {
        // Otherwise, start the Express server.
        app.listen(PORT, () => {
            console.log(`✅ COSMOS backend running on http://localhost:${PORT}`);
        });
    }
}

