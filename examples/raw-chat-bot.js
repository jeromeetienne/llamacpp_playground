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

const modelPath = Path.join(__dirname, "../models/llama-2-7b-arguments.Q2_K.gguf");
const model = new LlamaModel({
        modelPath
});
const context = new LlamaContext({ model });
const session = new LlamaChatSession({ context });


const question1 = "Hi there, how are you?";
console.log("User: " + question1);

const answer1 = await session.prompt(question1);
console.log("AI: " + answer1);


const question2 = "Summarize what you said";
console.log("User: " + question2);

const answer2 = await session.prompt(question2);
console.log("AI: " + answer2);