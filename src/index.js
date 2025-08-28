import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { getDynamicPrompt } from "./prompts/dynamic.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

let sessionTokenCount = { input: 0, output: 0, total: 0 };

function loadPrompt(fileName) {
  const filePath = path.join("src", "prompts", fileName);
  return fs.readFileSync(filePath, "utf8");
}

function logTokens(usage) {
  if (!usage) return console.log("⚠️ No token usage metadata available.");

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

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("⚠️ Usage: node src/index.js <mode> <question>");
    console.log("Modes: system | zeroShot | oneShot | multiShot | dynamic | cot | structured | functionCall | embeddings");
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
      finalPrompt = `Answer the following strictly in JSON.\n\nQuestion: ${query}`;
      break;
    case "functionCall":
      finalPrompt = query;
      break;
    case "embeddings":
      finalPrompt = query;
      break;
    default:
      console.log("Invalid mode.");
      process.exit(1);
  }

  try {
    let result;

    if (mode === "embeddings") {
      result = await embeddingModel.embedContent(query);

      console.log("\n🧩 Embedding Result:");
      const vector = result.embedding.values;
      console.log(`Vector length: ${vector.length}`);
      console.log("First 10 dimensions:", vector.slice(0, 10));
    } else if (mode === "functionCall") {
      // Example function calling logic (from earlier step)
      const functions = [
        {
          name: "getWeather",
          description: "Get the current weather for a location",
          parameters: {
            type: "object",
            properties: {
              location: { type: "string", description: "City and country" },
              unit: { type: "string", enum: ["celsius", "fahrenheit"] }
            },
            required: ["location"]
          }
        },
        {
          name: "getStockPrice",
          description: "Fetch latest stock price for a company",
          parameters: {
            type: "object",
            properties: {
              ticker: { type: "string", description: "Stock ticker symbol" }
            },
            required: ["ticker"]
          }
        }
      ];

      result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: finalPrompt }] }],
        tools: [{ functionDeclarations: functions }],
        generationConfig: { temperature: 0, maxOutputTokens: 256 },
      });

      console.log("\n🔧 Function Call Response:");
      console.log(JSON.stringify(result.response.candidates[0].content, null, 2));
      logTokens(result.response.usageMetadata);
    } else {
      result = await model.generateContent(finalPrompt);
      console.log("\n🌌 Answer:");
      console.log(result.response.text());
      logTokens(result.response.usageMetadata);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
