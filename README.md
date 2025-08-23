# 🌌 COSMOS – Cognitive Ontology System for Mapping Outer Space

COSMOS is an **AI-powered glossary system** that maps, explains, and relates **space science concepts** using Large Language Model (LLM) techniques. It demonstrates practical implementations of embeddings, similarity functions, prompting strategies, and evaluation pipelines, making it an ideal educational + portfolio project.

---

## Project Idea

The goal of COSMOS is to provide **clear explanations of astronomy and space science terms**. For example, when asked *“What is a Nebula?”*, COSMOS retrieves the closest glossary term using embeddings similarity, applies prompting techniques, and returns a structured, easy-to-understand explanation.

This project ties together multiple **GenAI concepts** such as zero-shot prompting, embeddings, cosine similarity, and evaluation pipelines.

---

## Features & Concepts Implemented

### Prompting Techniques

* **Zero-Shot Prompting** → Directly asks the LLM to explain a term.
* **One-Shot Prompting** → Provides 1 example glossary entry before asking for a new one.
* **Multi-Shot Prompting** → Provides multiple examples to guide the response.
* **Chain-of-Thought Prompting** → Encourages the model to reason step by step when answering.
* **Dynamic Prompting** → Adapts prompts based on user input complexity.
* **System & User Prompts (RTFC Framework)** → Roles and constraints defined clearly.

### Embeddings & Similarity

* Implemented **text embeddings** to represent glossary terms as vectors.
* Implemented multiple **similarity functions** to compare embeddings:

  * Cosine Similarity
  * Dot Product Similarity
  * Euclidean (L2) Distance

### Vector Database

* Glossary entries are stored as embeddings in a simple **vector database**.
* Query embeddings are compared against stored vectors to retrieve the most relevant concept.

### Function Calling

* Demonstrated function calling where the AI calls a retrieval function to fetch glossary data.

### Output Handling

* **Structured Output** → JSON-like format containing: term, definition, difficulty level.
* **Stop Sequences** → Prevents overly long or irrelevant outputs.

### Model Parameters

* **Temperature** → Controls creativity of responses.
* **Top-K & Top-P Sampling** → Controls randomness vs determinism.
* **Tokens & Tokenization** → Logs token usage per request.

### Evaluation Pipeline

* Dataset of **5 sample queries** with expected answers.
* **Judge prompt** compares LLM output vs expected result.
* **Automated testing framework** runs evaluation and computes accuracy.

---

## Project Structure

```
COSMOS/
│── glossary.json          # Space glossary terms + definitions
│── embeddings.py          # Embedding generation + similarity functions
│── prompting.py           # Prompting strategies (zero-shot, few-shot, etc.)
│── retrieval.py           # Vector DB retrieval + similarity scoring
│── evaluation.py          # Dataset + testing framework
│── main.py                # Entry point: runs glossary queries
│── README.md              # Project documentation (this file)
```

---

## Technical Workflow

1. **User Query** → e.g., “What is a black hole?”
2. **Embedding Generation** → Query is converted into a vector.
3. **Similarity Search** → Compared with glossary embeddings using cosine/dot/L2.
4. **Relevant Term Retrieved** → e.g., *Black Hole* entry.
5. **Prompting Applied** → AI uses few-shot or CoT prompting to generate explanation.
6. **Structured Output** → Clean JSON response returned.

---

## Example Run

**Input:** `Tell me about a Nebula.`

**Process:**

* Query → Embedding vector generated.
* Similarity search → Closest match = *Nebula*.
* Prompt → Multi-shot prompting applied.
* Output →

```json
{
  "term": "Nebula",
  "definition": "A nebula is a giant cloud of dust and gas in space, often serving as a stellar nursery where new stars are born.",
  "difficulty": "Beginner"
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

**Judge Prompt Parameters:**

* Accuracy of definition
* Correctness of retrieved term
* Conciseness and clarity

---

## Conclusion

COSMOS is not just a glossary bot—it’s a **demonstration of how modern LLM techniques can be combined to build an intelligent knowledge system**. It highlights prompting strategies, embeddings, similarity search, and evaluation methods in one cohesive project.

---
