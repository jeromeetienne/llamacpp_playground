/**
 * - from https://withcatai.github.io/node-llama-cpp/guide/
 */

// node imports
import Path from "path";

// npm imports
import { LlamaModel, LlamaContext, LlamaChatSession } from "node-llama-cpp";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));

// const modelPath = Path.join(__dirname, "../models/codellama-7b-instruct.Q4_K_M.gguf");
const modelPath = Path.join(__dirname, "../models/mistral-7b-instruct-v0.1.Q6_K.gguf");
const llamaModel = new LlamaModel({
        modelPath
});
const llamaContext = new LlamaContext({ model: llamaModel });
const llamaSession = new LlamaChatSession({ context: llamaContext });

console.log('modelPath', Path.basename(modelPath));

// Start the conversation

const question1 = "Hi there, how are you?";
console.log("User: " + question1);

const answer1 = await llamaSession.prompt(question1);
console.log("AI: " + answer1);


const question2 = "Summarize what you said";
console.log("User: " + question2);

const answer2 = await llamaSession.prompt(question2);
console.log("AI: " + answer2);