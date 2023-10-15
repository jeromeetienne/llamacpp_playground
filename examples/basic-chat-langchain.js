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

const modelPath = Path.join(__dirname, "../models/codellama-7b-instruct.Q4_K_M.gguf");
const model = new LlamaCpp({ modelPath: modelPath });

const question = "Where do Llamas come from?";
console.log(`User: ${question}`);

const response = await model.call(question);
console.log(`AI : ${response}`);