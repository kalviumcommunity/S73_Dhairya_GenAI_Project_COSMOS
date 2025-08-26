# 🌌 COSMOS – Cognitive Ontology System for Mapping Outer Space

SpaceSense is a **Generative AI-based educational assistant** that explains **space science concepts** in a simple, well-structured way using the **Google Gemini-1.5-Flash API**.  

This project demonstrates multiple **advanced prompting strategies** (RTFC, Zero-shot, One-shot, Multi-shot, Dynamic, Chain-of-Thought) along with an **evaluation pipeline** for testing correctness and quality of model responses.

---

## Project Idea

The goal is to make space science concepts **easy to understand** for students, enthusiasts, and learners.  
Instead of searching scattered resources, users can query the system and get **clear, structured, and accurate answers**.

---

## Implementation

### Tech Stack
- **Backend:** Node.js + Express.js
- **Frontend (optional/simple):** HTML/CSS/JS input box
- **LLM API:** Gemini-1.5-Flash
- **Evaluation:** Custom Judge Prompt + JSON test runner

### Flow
1. **User Input:** User asks a space-related question.  
2. **System Prompt:** Ensures responses are structured, simple, and accurate.  
3. **User Prompt:** Contains the query.  
4. **Model Output:** Gemini generates structured explanation.  
5. **Evaluation Pipeline:** Validates answers against expected dataset.

---

## Prompting Techniques Implemented
1. **RTFC Framework:** Role, Task, Format, Context prompts.  
2. **Zero-Shot Prompting:** No examples, just direct instructions.  
3. **One-Shot Prompting:** One example provided.  
4. **Multi-Shot Prompting:** Multiple examples provided.  
5. **Dynamic Prompting:** System adjusts based on user query complexity.  
6. **Chain-of-Thought Prompting:** Encourages step-by-step reasoning.

---

## Evaluation Pipeline
- Dataset of 5+ queries with expected outputs.  
- Judge Prompt compares model response with expected answer.  
- Automated script runs all test cases and logs accuracy.

---