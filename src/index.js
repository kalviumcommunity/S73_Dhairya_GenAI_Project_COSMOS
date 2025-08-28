import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { getDynamicPrompt } from "./prompts/dynamic.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Running total of tokens for session
let sessionTokenCount = {
  input: 0,
  output: 0,
  total: 0,
};

/**
 * Load prompt file by name
 */
function loadPrompt(fileName) {
  const filePath = path.join("src", "prompts", fileName);
  return fs.readFileSync(filePath, "utf8");
}

/**
 * Log token usage after each call
 */
function logTokens(usage) {
  if (!usage) {
    console.log("⚠️ No token usage metadata available.");
    return;
  }

  const inputTokens = usage.promptTokenCount || 0;
  const outputTokens = usage.candidatesTokenCount || 0;
  const totalTokens = usage.totalTokenCount || inputTokens + outputTokens;

  // Log per-call usage
  console.log(
    `\nTokens used this call: input=${inputTokens}, output=${outputTokens}, total=${totalTokens}`
  );

  // Update running session totals
  sessionTokenCount.input += inputTokens;
  sessionTokenCount.output += outputTokens;
  sessionTokenCount.total += totalTokens;

  console.log(
    `Running session totals: input=${sessionTokenCount.input}, output=${sessionTokenCount.output}, total=${sessionTokenCount.total}`
  );
}

/**
 * Main runner
 */
async function run() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log("⚠️ Usage: node src/index.js <mode> <question> [temperature] [topP]");
    console.log("Modes: system | zeroShot | oneShot | multiShot | dynamic | cot");
    console.log("Example: node src/index.js zeroShot 'What is dark matter?' 0.7 0.9");
    process.exit(1);
  }

  const mode = args[0];
  const query = args.slice(1, -2).join(" "); // leave space for temp + topP
  const tempArg = args[args.length - 2];
  const topPArg = args[args.length - 1];

  // Defaults
  let temperature = 0.7;
  let topP = 1.0;

  // Parse args
  if (!isNaN(parseFloat(tempArg))) {
    temperature = parseFloat(tempArg);
  }
  if (!isNaN(parseFloat(topPArg))) {
    topP = parseFloat(topPArg);
  }

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
    default:
      console.log("Invalid mode. Use: system | zeroShot | oneShot | multiShot | dynamic | cot");
      process.exit(1);
  }

  try {
    // Temperature + Top-p applied
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature: temperature,
        topP: topP,
        maxOutputTokens: 512,
      },
    });

    console.log(`\n🌡️ Temperature used: ${temperature}`);
    console.log(`Top-p used: ${topP}`);
    console.log("\n🌌 Answer:");
    console.log(result.response.text());

    // Log token usage
    logTokens(result.response.usageMetadata);

  } catch (err) {
    console.error("Error while generating response:", err.message);
  }
}

run();
