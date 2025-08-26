# 🌌 COSMOS – Cognitive Ontology System for Mapping Outer Space

**COSMOS** is an **AI-powered glossary system** built with **Next.js (frontend)** and **Node.js serverless functions (backend)** that maps, explains, and relates **space science concepts** using the **Google Gemini family of models**.

---

## Project Idea

The goal of COSMOS is to provide **clear, structured explanations of astronomy and space science terms**.

For example, when a user asks *“What is a Nebula?”*:

1. The query is processed using **embeddings and similarity functions** to find the closest glossary entry.
2. A **prompting strategy** (Zero-Shot, Few-Shot, Chain-of-Thought, etc.) is applied.
3. The Gemini model generates a **structured JSON output** containing the explanation, difficulty level, and related terms.

This allows users to **compare how different prompting techniques shape the AI’s response**, making COSMOS both an interactive glossary and a learning lab for GenAI.

---

## Features & Concepts

### Prompting Strategies

* **Zero-Shot Prompting** → Direct explanation with no examples.
* **One-Shot Prompting** → Uses a single example to guide the response.
* **Few-Shot Prompting** → Provides multiple examples for consistency.
* **Chain-of-Thought (CoT)** → Encourages step-by-step reasoning.
* **Dynamic Prompting** → Adapts prompts based on input complexity.
* **RTFC Framework** (Role, Task, Format, Constraints) for robust system + user prompting.

### Embeddings & Similarity

* Glossary terms stored as **text embeddings**.
* Supports multiple **similarity functions**:

  * Cosine Similarity
  * Dot Product
  * Euclidean (L2) Distance

### Intelligent Glossary

* Queries retrieve the **most relevant term** using embeddings.
* Related concepts are suggested to encourage exploration.
* Output is **structured** (JSON-like) for consistency and clarity.

### Model Controls

* **Temperature** for creativity.
* **Top-K & Top-P Sampling** for balance between determinism and diversity.
* **Stop Sequences** to ensure clean, bounded outputs.
* Token usage logging for evaluation.

### Automated Evaluation Pipeline

* Includes a dataset of sample queries with expected terms.
* A **judge prompt** scores correctness and clarity.
* Framework automatically runs evaluation and computes accuracy.

---

## Workflow

1. **User Query** → e.g., “Tell me about black holes.”
2. **Embedding Generation** → Query converted to a vector.
3. **Similarity Search** → Compared against glossary embeddings.
4. **Relevant Term Retrieved** → e.g., *Black Hole*.
5. **Prompting Applied** → Selected strategy builds the AI request.
6. **Gemini API Call** → Returns structured JSON.
7. **Result Displayed** → Clean UI with definition, difficulty, and related terms.

---

## Example

**Input:** `Tell me about a Nebula.`

**Output (JSON):**

```json
{
  "term": "Nebula",
  "definition": "A nebula is a giant cloud of dust and gas in space, often serving as a stellar nursery where new stars are born.",
  "difficulty": "Beginner",
  "related": ["Star Formation", "Supernova", "Galaxy"]
}
```

---

## Evaluation Dataset

| Query                | Expected Term |
| -------------------- | ------------- |
| What is a Nebula?    | Nebula        |
| Define a Black Hole  | Black Hole    |
| Explain Supernova    | Supernova     |
| What are Exoplanets? | Exoplanet     |
| Define Galaxy        | Galaxy        |

---

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment:**
   Create a `.env.local` file in the root:

   ```
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Run development server:**

   ```bash
   npm run dev
   ```

4. **Open app:**
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Conclusion

COSMOS is more than a glossary—it’s a **GenAI learning playground**.
It demonstrates how to integrate **prompting techniques, embeddings, vector search, evaluation pipelines, and structured outputs** into one cohesive application, powered by **Next.js, Node.js, and Google Gemini**.

