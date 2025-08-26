import fs from "fs";
import path from "path";

/**
 * Returns a dynamic prompt by reading from dynamicPrompt.txt
 * and replacing ${user_query} with the actual query.
 */
export function getDynamicPrompt(query) {
  // Load dynamicPrompt.txt content
  const filePath = path.join("src", "prompts", "dynamicPrompt.txt");
  const template = fs.readFileSync(filePath, "utf8");

  // Decide if query is short or complex
  if (query.trim().split(" ").length <= 2) {
    return template
      .replace(
        "${user_query}",
        query
      )
      .replace(
        "If the user’s query is SHORT (one or two words only):",
        "Detected: SHORT query. Please return only a short definition (1–2 sentences)."
      );
  } else {
    return template
      .replace(
        "${user_query}",
        query
      )
      .replace(
        "If the user’s query is LONGER or COMPLEX (a question, multi-word query):",
        "Detected: COMPLEX query. Please return a detailed structured answer with definition, explanation, analogy, and summary."
      );
  }
}
