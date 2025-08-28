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
    console.log("⚠️ Usage: node src/index.js <mode> <question> [temperature] [topP] [topK] [stopSequence]");
    console.log("Modes: system | zeroShot | oneShot | multiShot | dynamic | cot");
    console.log("Example: node src/index.js zeroShot 'What is dark matter?' 0.7 0.9 40 ###");
    process.exit(1);
  }

  const mode = args[0];
  const possibleNumbers = args.slice(1).filter(arg => !isNaN(parseFloat(arg)));
  const possibleStopSeq = args.slice(1).filter(arg => isNaN(parseFloat(arg)) && arg !== mode);

  // Question is all string args except stop sequence
  const query = possibleStopSeq.length > 0
    ? possibleStopSeq.slice(0, -1).join(" ")
    : possibleStopSeq.join(" ");

  // Defaults
  let temperature = 0.7;
  let topP = 1.0;
  let topK = 40;
  let stopSequence = null;

  // Parse numeric args
  if (possibleNumbers.length >= 1) temperature = parseFloat(possibleNumbers[0]);
  if (possibleNumbers.length >= 2) topP = parseFloat(possibleNumbers[1]);
  if (possibleNumbers.length >= 3) topK = parseInt(possibleNumbers[2]);

  // Stop sequence (last non-numeric arg if provided)
  if (possibleStopSeq.length > 0) {
    stopSequence = possibleStopSeq[possibleStopSeq.length - 1];
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
    // Temperature + Top-p + Top-k + Stop Sequence applied
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature: temperature,
        topP: topP,
        topK: topK,
        stopSequences: stopSequence ? [stopSequence] : undefined,
        maxOutputTokens: 512,
      },
    });

    console.log(`\n🌡️ Temperature used: ${temperature}`);
    console.log(`🎯 Top-p used: ${topP}`);
    console.log(`🔢 Top-k used: ${topK}`);
    if (stopSequence) console.log(`⛔ Stop sequence used: "${stopSequence}"`);
    console.log("\n🌌 Answer:");
    console.log(result.response.text());

    // Log token usage
    logTokens(result.response.usageMetadata);

  } catch (err) {
    console.error("Error while generating response:", err.message);
  }
}

run();
