export function getDynamicPrompt(query) {
  if (query.length < 10) {
    return "Answer in very short and simple terms.";
  } else {
    return "Provide a detailed, structured explanation with 1) Definition 2) Explanation 3) Analogy 4) Summary.";
  }
}