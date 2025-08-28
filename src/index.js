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

  console.log(
    `\nTokens used this call: input=${inputTokens}, output=${outputTokens}, total=${totalTokens}`
  );

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
    console.log("Modes: system | zeroShot | oneShot | multiShot | dynamic | cot | structured");
    console.log("Example: node src/index.js structured 'What is dark matter?'");
    process.exit(1);
  }

  const mode = args[0];
  const query = args.slice(1).join(" ");

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
    case "structured":
      finalPrompt = `Answer the following question strictly in JSON format.\n\nQuestion: ${query}`;
      break;
    default:
      console.log("Invalid mode. Use: system | zeroShot | oneShot | multiShot | dynamic | cot | structured");
      process.exit(1);
  }

  try {
    let result;

    if (mode === "structured") {
      // Structured Output
      const schema = {
        type: "object",
        properties: {
          answer: { type: "string" },
          explanation: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["answer", "explanation"],
      };

      result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        generationConfig: {
          responseMimeType: "application/json", // force JSON output
          responseSchema: schema, // validate JSON schema
          temperature: 0.7,
          maxOutputTokens: 512,
        },
      });

      console.log("\n🛠️ Structured JSON Answer:");
      console.log(result.response.text());
    } else {
      // Normal output for other modes
      result = await model.generateContent(finalPrompt);
      console.log("\n🌌 Answer:");
      console.log(result.response.text());
    }

    // Token usage
    logTokens(result.response.usageMetadata);

  } catch (err) {
    console.error("Error while generating response:", err.message);
  }
}

run();
