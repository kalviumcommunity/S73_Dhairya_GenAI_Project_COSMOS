import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Load dataset + judge prompt
const dataset = JSON.parse(fs.readFileSync("src/evaluation/dataset.json", "utf8"));
const judgePrompt = fs.readFileSync("src/evaluation/judgePrompt.txt", "utf8");

async function evaluate() {
  console.log("Running evaluation on dataset...\n");

  let results = [];

  for (let i = 0; i < dataset.length; i++) {
    const { question, expected } = dataset[i];

    // Step 1: Get model answer
    const qaPrompt = `User Question: ${question}\nAnswer clearly.`;
    const answer = await model.generateContent(qaPrompt);
    const modelAnswer = answer.response.text();

    // 🔹 Log tokens for QA step
    if (answer.response.usageMetadata) {
      console.log(
        `Tokens used (Answering Q${i + 1}): input=${answer.response.usageMetadata.promptTokenCount}, output=${answer.response.usageMetadata.candidatesTokenCount}, total=${answer.response.usageMetadata.totalTokenCount}`
      );
    }

    // Step 2: Judge the model’s answer
    const judgeInput = judgePrompt
      .replace("${expected}", expected)
      .replace("${model_answer}", modelAnswer);

    const judgement = await model.generateContent(judgeInput);
    let evaluation;
    try {
      evaluation = JSON.parse(judgement.response.text());
    } catch {
      evaluation = { verdict: "Error", total: 0 };
    }

    // Log tokens for Judgement step
    if (judgement.response.usageMetadata) {
      console.log(
        `Tokens used (Judging Q${i + 1}): input=${judgement.response.usageMetadata.promptTokenCount}, output=${judgement.response.usageMetadata.candidatesTokenCount}, total=${judgement.response.usageMetadata.totalTokenCount}`
      );
    }

    // Store result
    results.push({
      question,
      expected,
      modelAnswer,
      ...evaluation
    });

    // Print each result
    console.log(`\nQ${i + 1}: ${question}`);
    console.log(`Expected: ${expected}`);
    console.log(`Model: ${modelAnswer}`);
    console.log(`Evaluation:`, evaluation);
  }

  // Final Summary
  console.log("\n================ SUMMARY ================");
  const total = results.length;
  const passes = results.filter(r => r.verdict === "Pass").length;
  const fails = results.filter(r => r.verdict === "Fail").length;

  const avgScore = (
    results.reduce((sum, r) => sum + (r.total || 0), 0) / total
  ).toFixed(2);

  console.log(`Total Samples: ${total}`);
  console.log(`Passed: ${passes}`);
  console.log(`Failed: ${fails}`);
  console.log(`Average Score: ${avgScore}/15`);
  console.log("=========================================\n");
}

evaluate();