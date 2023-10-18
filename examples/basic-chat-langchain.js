/**
 * - from https://js.langchain.com/docs/modules/model_io/models/llms/integrations/llama_cpp
 */

// node imports
import Path from "path";

// npm imports
import { LlamaCpp } from "langchain/llms/llama_cpp";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));

// const modelPath = Path.join(__dirname, "../models/codellama-7b-instruct.Q4_K_M.gguf");
const modelPath = Path.join(__dirname, "../models/mistral-7b-instruct-v0.1.Q6_K.gguf");
const model = new LlamaCpp({ modelPath: modelPath });

// Start the conversation

const question1 = "Hi there, how are you?";
console.log("User: " + question1);

const answer1 = await model.call(question1);
console.log("AI: " + answer1);

const question2 = "Summarize what you said";
console.log("User: " + question2);

const answer2 = await model.call(question2);
console.log("AI: " + answer2);
