# Experimentation evaluating llamacpp

## Goals
- [ ] Compare the performance of llamacpp models
- [ ] do it with 2 technologies: natively node-llama-cpp and langchain.js
  - langchain.js support for llamacpp is not perfect
- [ ] What are the limits of langchain.js's support for llamacpp

## Langchain.js support status
- langchain's LLamaCpp doesn't support grammar
  - the json grammar is a **KEY** feature of llamacpp, improving quality of structured output
  - **NOTE** Q. could we improve langchain support
- langchain's LLamaCpp doesn't support chat-model