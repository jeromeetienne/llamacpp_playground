/**
 * - from https://js.langchain.com/docs/modules/model_io/models/llms/integrations/llama_cpp
 */

// node imports
import Path from "path";
import Fs from 'fs'

// npm imports
import { LlamaModel, LlamaContext, LlamaChatSession, LlamaGrammar, LlamaJsonSchemaGrammar, LlamaChatPromptWrapper } from "node-llama-cpp";
import CliColor from "cli-color";
import Zod from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import Json5 from "json5";

// local imports
import LlamaUtils from "../../src/llama-utils.js";
import AvailableModelPaths from "../../src/available_model_paths.js";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));


// const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.LLAMA_2_7B_CHAT_Q2_K)
const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
// const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.CODELLAMA_7B_INSTRUCT_Q4_K_M)
// const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.CODELLAMA_13B_INSTRUCT_Q3_K_M)


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	init
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const {llamaContext, llamaModel} = await LlamaUtils.loadModelContext(modelPath)

// await LlamaUtils.warmUpContext(llamaContext);

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const responseZodSchema = Zod.array(Zod.object({
	answer: Zod.string(),
}))

const responseJsonSchemaFull = zodToJsonSchema(responseZodSchema, "responseJsonSchema");
const responseJsonSchema = /** @type {Object} */(responseJsonSchemaFull.definitions?.['responseJsonSchema'])
const responseSample = [{"answer": "My name is John." }, {"answer": "I like blue." }]

console.log(`reponse json-schema ${JSON.stringify(responseJsonSchema, null, 2)}`)

const contextLineLimit = 10
const contextText = await LlamaUtils.loadText(contextLineLimit)

// const contextText = `My name is john, i like blue and eat sausages. i speak french and i listen to rock.`

const systemPrompt = `Be sure to Format your response in JSON as an array of objects with the following format:
${JSON.stringify(responseSample)}`;

const nQuestions = 3;
const question = `Here is a context, you will be asked to generate questions about it:
${contextText}

Please generate ${nQuestions} question/answer tuples about this context, make your questions are clear and simple, the answer MUST be short and come from the context.`;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const llamaGrammar = new LlamaJsonSchemaGrammar(responseJsonSchema)
// const llamaGrammar = await LlamaGrammar.getFor("json");

console.log(`System Prompt : ${CliColor.green(systemPrompt)}`);
console.log(`Question : ${CliColor.green(question)}`);
const responseJson = await LlamaUtils.promptGrammarJsonOne(llamaContext, llamaGrammar, systemPrompt, question);
console.log(`Response : ${CliColor.cyan(JSON.stringify(responseJson, null, '\t'))}`)
