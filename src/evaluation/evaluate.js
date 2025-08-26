import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Load files
 */
const dataset = JSON.parse(fs.readFileSync("src/evaluation/dataset.json", "utf8"));
const judgePrompt = fs.readFileSync("src/evaluation/judgePrompt.txt", "utf8");

/**
 * Function: Run evaluation
 */
async function evaluate() {
  console.log("Running evaluation on dataset...\n");

  for (let i = 0; i < dataset.length; i++) {
    const { question, expected } = dataset[i];

    // Step 1: Get model answer
    const qaPrompt = `User Question: ${question}\nAnswer clearly.`;
    const answer = await model.generateContent(qaPrompt);
    const modelAnswer = answer.response.text();

    // Step 2: Send judge prompt
    const judgeInput = judgePrompt
      .replace("${expected}", expected)
      .replace("${model_answer}", modelAnswer);

    const judgement = await model.generateContent(judgeInput);

    console.log(`\nQ${i + 1}: ${question}`);
    console.log(`Expected: ${expected}`);
    console.log(`Model: ${modelAnswer}`);
    console.log(`Evaluation: ${judgement.response.text()}`);
  }
}

evaluate();
