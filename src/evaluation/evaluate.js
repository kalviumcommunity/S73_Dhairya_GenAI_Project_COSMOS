import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const dataset = JSON.parse(fs.readFileSync("dataset.json", "utf8"));
const judgePrompt = fs.readFileSync("src/evaluation/judgePrompt.txt", "utf8");

async function evaluate() {
  for (let sample of dataset) {
    const response = await model.generateContent(sample.query);
    const modelAnswer = response.response.text();

    const judge = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${judgePrompt}\n\nExpected: ${sample.expected}\nGot: ${modelAnswer}`,
            },
          ],
        },
      ],
    });

    console.log(`Q: ${sample.query}`);
    console.log(`Model Answer: ${modelAnswer}`);
    console.log(`Judge: ${judge.response.text()}`);
    console.log("---------------");
  }
}

evaluate();
