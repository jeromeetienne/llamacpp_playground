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
import Utils from "../../src/utils.js";
import AvailableModelPaths from "../../src/available_model_paths.js";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));


// const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.LLAMA_2_7B_CHAT_Q2_K)
// const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.ZEPHYR_7B_ALPHA_Q6_K)
// const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.CODELLAMA_7B_INSTRUCT_Q4_K_M)
// const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.CODELLAMA_13B_INSTRUCT_Q3_K_M)


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	init
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const { llamaContext } = await LlamaUtils.initModelAndContext(modelPath)

// await LlamaUtils.warmUpContext(llamaContext);

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const responseZodSchema = Zod.object({
	answer: Zod.string(),
})

const responseJsonSchemaFull = zodToJsonSchema(responseZodSchema, "responseJsonSchema");
const responseJsonSchema = /** @type {Object} */(responseJsonSchemaFull.definitions?.['responseJsonSchema'])
const responseSample = { "answer": "<YOUR ANSWER GOES HERE>" }
console.assert(responseZodSchema.parse(responseSample) !== undefined, `responseSample should be valid`);


// console.log(`reponse json-schema ${JSON.stringify(responseJsonSchema, null, 2)}`)

const contextText = await Utils.loadText()

const systemPrompt = `Be sure to Format your response in JSON with the following format:
${JSON.stringify(responseSample)}`;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const datasetPath = Path.join(__dirname, './data', 'data.dataset.json')
const datasetFileContent = await Fs.promises.readFile(datasetPath, 'utf-8')
const datasetArray = /** @type {import("./type.d.js").DatasetArrayJson} */(Json5.parse(datasetFileContent))


const predictionArrayJson = /** @type {import("./type.d.js").PredictionArrayJson} */([])

const llamaGrammar = new LlamaJsonSchemaGrammar(responseJsonSchema)
for (const datasetItem of datasetArray) {
	const question = `Here is a context between CONTEXT_BEGIN and CONTEXT_END:
CONTEXT_BEGIN
${contextText}
CONTEXT_END

Based on this context, answer the following question:
${datasetItem.question}`;

	console.log(`Question : ${CliColor.green(datasetItem.question)}`);
	const responseJson = await LlamaUtils.promptGrammarJsonOne(llamaContext, llamaGrammar, systemPrompt, question);
	console.log(`Answer : ${CliColor.cyan(responseJson.answer)}`)
	const predictionItemJson = /** @type {import("./type.d.js").PredictionItemJson} */({ predictedAnswer: responseJson.answer })
	predictionArrayJson.push(predictionItemJson)
}

console.log(`OUTPUT by ${CliColor.red(Path.basename(modelPath))}`)
console.log(`${JSON.stringify(predictionArrayJson, null, '\t')}`)
