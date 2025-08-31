require("dotenv").config(); // Load environment variables from .env file
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Ensure API key is available
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Load dataset + judge prompt
const datasetPath = path.join(__dirname, "dataset.json");
const judgePromptPath = path.join(__dirname, "judgePrompt.txt");

const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8"));
const judgePrompt = fs.readFileSync(judgePromptPath, "utf8");

async function evaluate() {
  console.log("Running evaluation on dataset...\n");

  const results = [];

  for (let i = 0; i < dataset.length; i++) {
    const { question, expected } = dataset[i];

    // === Step 1: Get model answer ===
    const qaPrompt = `User Question: ${question}\nAnswer clearly.`;
    const answer = await model.generateContent(qaPrompt);
    const modelAnswer = answer.response.text();

    // Log tokens for QA step
    if (answer.response.usageMetadata) {
      console.log(
        `Tokens (Answering Q${i + 1}): input=${answer.response.usageMetadata.promptTokenCount}, output=${answer.response.usageMetadata.candidatesTokenCount}, total=${answer.response.usageMetadata.totalTokenCount}`
      );
    }

    // === Step 2: Judge the model’s answer ===
    const judgeInput = judgePrompt
      .replace("${expected}", expected)
      .replace("${model_answer}", modelAnswer);

    const judgement = await model.generateContent(judgeInput);
    let evaluation;

    try {
      evaluation = JSON.parse(judgement.response.text());
    } catch (err) {
      console.error(`⚠️ Could not parse judge response for Q${i + 1}:`, judgement.response.text());
      evaluation = { verdict: "Error", total: 0, reasoning: "Invalid JSON from judge" };
    }

    // 🔹 Log tokens for Judgement step
    if (judgement.response.usageMetadata) {
      console.log(
        `Tokens (Judging Q${i + 1}): input=${judgement.response.usageMetadata.promptTokenCount}, output=${judgement.response.usageMetadata.candidatesTokenCount}, total=${judgement.response.usageMetadata.totalTokenCount}`
      );
    }

    // Store result
    results.push({
      question,
      expected,
      modelAnswer,
      ...evaluation
    });

    // === Print each result ===
    console.log(`\nQ${i + 1}: ${question}`);
    console.log(`     Expected: ${expected}`);
    console.log(`     Model: ${modelAnswer}`);
    console.log(`     Evaluation:`, evaluation);
  }

  // === Step 3: Final Summary ===
  console.log("\n================SUMMARY ================");
  const total = results.length;
  const passes = results.filter(r => r.verdict === "Pass").length;
  const fails = results.filter(r => r.verdict === "Fail").length;
  const avgScore = (
    results.reduce((sum, r) => sum + (r.total || 0), 0) / total
  ).toFixed(2);
  const passRate = ((passes / total) * 100).toFixed(1);

  console.log(`Total Samples: ${total}`);
  console.log(`Passed: ${passes}`);
  console.log(`Failed: ${fails}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log(`Average Score: ${avgScore}/15`);
  console.log("============================================\n");

  // === Step 4: Save results ===
  const resultsPath = path.join(__dirname, 'evaluation_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${resultsPath}`);
}

evaluate();
