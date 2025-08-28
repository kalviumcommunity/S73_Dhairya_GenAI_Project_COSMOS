// Load env and imports
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

// Running token usage counter
let sessionTokenCount = { input: 0, output: 0, total: 0 };

// Mock vector DB (replace with Pinecone, Weaviate, or FAISS in production)
let vectorDB = [];

/**
 * Load prompt file by name
 */
function loadPrompt(fileName) {
  const filePath = path.join(__dirname, "prompts", fileName);
  return fs.readFileSync(filePath, "utf8");
}

/**
 * Log token usage
 */
function logTokens(usage) {
  if (!usage) {
    console.log("⚠️ No token usage metadata available.");
    return;
  }
  const inputTokens = usage.promptTokenCount || 0;
  const outputTokens = usage.candidatesTokenCount || 0;
  const totalTokens = usage.totalTokenCount || inputTokens + outputTokens;

  console.log(
    `\nTokens this call: input=${inputTokens}, output=${outputTokens}, total=${totalTokens}`
  );

  sessionTokenCount.input += inputTokens;
  sessionTokenCount.output += outputTokens;
  sessionTokenCount.total += totalTokens;

  console.log(
    `Running totals: input=${sessionTokenCount.input}, output=${sessionTokenCount.output}, total=${sessionTokenCount.total}`
  );
}

/**
 * Similarity metrics
 */
function cosineSim(vecA, vecB) {
  const dot = vecA.reduce((sum, v, i) => sum + v * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(vecB.reduce((sum, v) => sum + v * v, 0));
  return dot / (magA * magB);
}
function euclideanDistance(vecA, vecB) {
  const sumSquares = vecA.reduce((sum, v, i) => sum + Math.pow(v - vecB[i], 2), 0);
  return Math.sqrt(sumSquares);
}
function dotProduct(vecA, vecB) {
  return vecA.reduce((sum, v, i) => sum + v * vecB[i], 0);
}

/**
 * Store and search vector DB
 */
async function storeInVectorDB(text, metadata = {}) {
  const embedding = await embeddingModel.embedContent(text);
  const vector = embedding.embedding.values;
  vectorDB.push({ vector, text, metadata });
  console.log(`Stored text in vector DB: "${text.slice(0, 40)}..."`);
}
async function searchVectorDB(query, topK = 3, metric = "cosine") {
  const embedding = await embeddingModel.embedContent(query);
  const queryVector = embedding.embedding.values;

  const scored = vectorDB.map((item) => {
    let score;
    if (metric === "cosine") {
      score = cosineSim(queryVector, item.vector);
    } else if (metric === "euclidean") {
      score = 1 / (1 + euclideanDistance(queryVector, item.vector)); // normalize
    } else if (metric === "dot") {
      score = dotProduct(queryVector, item.vector);
    }
    return { ...item, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Express API route
 */
const systemPrompt = fs.readFileSync(
  path.join(__dirname, "prompts", "systemPrompt.txt"),
  "utf8"
);

app.post("/api/explain", async (req, res) => {
  const { term } = req.body;
  if (!term) return res.status(400).json({ error: "Missing term" });

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${term}` }],
        },
      ],
    });

    res.json({
      prompt: `${systemPrompt}\n\nUser Question: ${term}`,
      aiText: result.response.text(),
    });
  } catch (err) {
    console.error("Error while generating response:", err);
    res.status(500).json({ error: "Gemini API error", details: err.message });
  }
});

/**
 * CLI runner
 */
async function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) return; // don’t run CLI if no args (so server can still start)

  if (args.length < 2) {
    console.log(
      "⚠️ Usage: node src/index.js <mode> <question> [temperature] [topP] [topK] [metric]"
    );
    process.exit(1);
  }

  const mode = args[0];
  const query = args.slice(1, -4).join(" ") || args[1];
  const tempArg = args[args.length - 4];
  const topPArg = args[args.length - 3];
  const topKArg = args[args.length - 2];
  const metricArg = args[args.length - 1];

  let temperature = isNaN(parseFloat(tempArg)) ? 0.7 : parseFloat(tempArg);
  let topP = isNaN(parseFloat(topPArg)) ? 1.0 : parseFloat(topPArg);
  let topK = isNaN(parseInt(topKArg)) ? 40 : parseInt(topKArg);
  let metric = ["cosine", "euclidean", "dot"].includes(metricArg)
    ? metricArg
    : "cosine";

  let finalPrompt = "";

  switch (mode) {
    case "system":
      finalPrompt = loadPrompt("systemPrompt.txt").replace("${user_query}", query);
      break;
    case "zeroShot":
      finalPrompt = loadPrompt("zeroShot.txt").replace("${user_query}", query);
      break;
    case "oneShot":
      finalPrompt = loadPrompt("oneShot.txt").replace("${user_query}", query);
      break;
    case "multiShot":
      finalPrompt = loadPrompt("multiShot.txt").replace("${user_query}", query);
      break;
    case "cot":
      finalPrompt = loadPrompt("chainOfThought.txt").replace("${user_query}", query);
      break;
    case "embed":
      await storeInVectorDB(query, { source: "user" });
      return;
    case "search":
      const results = await searchVectorDB(query, 3, metric);
      console.log(`\nVector DB search results using ${metric} similarity:`);
      results.forEach((r, i) =>
        console.log(`${i + 1}. ${r.text} (score=${r.score.toFixed(3)})`)
      );
      return;
    default:
      console.log("Invalid mode.");
      process.exit(1);
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature,
        topP,
        topK,
        maxOutputTokens: 512,
        stopSequences: ["### END"],
      },
    });

    console.log(`\n🌡️ Temp=${temperature}, TopP=${topP}, TopK=${topK}`);
    console.log("\n🌌 Answer:");
    console.log(result.response.text());

    logTokens(result.response.usageMetadata);
  } catch (err) {
    console.error("⚠️ Error generating response:", err.message);
  }
}

run();

// Start express server
app.listen(PORT, () => {
  console.log(`✅ COSMOS backend running on http://localhost:${PORT}`);
});
