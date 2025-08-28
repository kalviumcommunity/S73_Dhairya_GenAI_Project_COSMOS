import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { getDynamicPrompt } from "./prompts/dynamic.js";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

// Running total of tokens for session
let sessionTokenCount = { input: 0, output: 0, total: 0 };

// Mock vector DB (replace with Pinecone, Weaviate, or FAISS in production)
let vectorDB = [];

/**
 * Load prompt file by name
 */
function loadPrompt(fileName) {
  const filePath = path.join("src", "prompts", fileName);
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
 * Compute cosine similarity between two vectors
 */
function cosineSim(vecA, vecB) {
  const dot = vecA.reduce((sum, v, i) => sum + v * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(vecB.reduce((sum, v) => sum + v * v, 0));
  return dot / (magA * magB);
}

/**
 * Store text in vector DB
 */
async function storeInVectorDB(text, metadata = {}) {
  const embedding = await embeddingModel.embedContent(text);
  const vector = embedding.embedding.values;
  vectorDB.push({ vector, text, metadata });
  console.log(`Stored text in vector DB: "${text.slice(0, 40)}..."`);
}

/**
 * Search vector DB
 */
async function searchVectorDB(query, topK = 3) {
  const embedding = await embeddingModel.embedContent(query);
  const queryVector = embedding.embedding.values;

  const scored = vectorDB.map((item) => ({
    ...item,
    score: cosineSim(queryVector, item.vector),
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

/**
 * Main runner
 */
async function run() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(
      "⚠️ Usage: node src/index.js <mode> <question> [temperature] [topP] [topK]"
    );
    process.exit(1);
  }

  const mode = args[0];
  const query = args.slice(1, -3).join(" "); // leave space for params
  const tempArg = args[args.length - 3];
  const topPArg = args[args.length - 2];
  const topKArg = args[args.length - 1];

  let temperature = isNaN(parseFloat(tempArg)) ? 0.7 : parseFloat(tempArg);
  let topP = isNaN(parseFloat(topPArg)) ? 1.0 : parseFloat(topPArg);
  let topK = isNaN(parseInt(topKArg)) ? 40 : parseInt(topKArg);

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
    case "dynamic":
      finalPrompt = getDynamicPrompt(query);
      break;
    case "cot":
      finalPrompt = loadPrompt("chainOfThought.txt").replace("${user_query}", query);
      break;
    case "embed":
      await storeInVectorDB(query, { source: "user" });
      return;
    case "search":
      const results = await searchVectorDB(query, 3);
      console.log("\n Vector DB search results:");
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
        stopSequences: ["### END"], // example stop
      },
    });

    console.log(`\n🌡️ Temp=${temperature}, TopP=${topP}, TopK=${topK}`);
    console.log("\n🌌 Answer:");
    console.log(result.response.text());

    // Token logging
    logTokens(result.response.usageMetadata);

  } catch (err) {
    console.error("⚠️ Error generating response:", err.message);
  }
}

run();
