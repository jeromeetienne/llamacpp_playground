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
import LlamaUtils from "../src/llama-utils.js";
import Utils from "../src/utils.js";
import AvailableModelPaths from "../src/available_model_paths.js";
import EsmPromptTemplate from "../src/esm-prompt-template.js";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {Object} DatasetPredictDirectOptions
 * @property {Boolean} verbose
 */

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default class DatasetPredictDirect {

	/**
	 * @param {string} modelName
	 * @param {string} evaluationName
	 * @param {Partial<DatasetPredictDirectOptions>} partialOptions
	 */
	static async predict(modelName, evaluationName, partialOptions = {}) {

		// handle default options
		partialOptions = Object.assign({}, /** @type {DatasetPredictDirectOptions} */({
			verbose: false,
		}), partialOptions)
		const options = /** @type {DatasetPredictDirectOptions} */(partialOptions)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	init llamaModel and llamaContext
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const modelPath = Path.join(__dirname, '../models', modelName)
		const { llamaContext, llamaModel } = await LlamaUtils.initModelAndContext(modelPath)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	build llamaGrammar
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const responseZodSchema = Zod.object({
			answer: Zod.string(),
		})

		const responseJsonSchemaFull = zodToJsonSchema(responseZodSchema, "responseJsonSchema");
		const responseJsonSchema = /** @type {Object} */(responseJsonSchemaFull.definitions?.['responseJsonSchema'])
		const responseSample = { "answer": "<YOUR ANSWER GOES HERE>" }
		console.assert(responseZodSchema.parse(responseSample) !== undefined, `responseSample should be valid`);
		const llamaGrammar = new LlamaJsonSchemaGrammar(responseJsonSchema)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		

		// console.log(`reponse json-schema ${JSON.stringify(responseJsonSchema, null, 2)}`)

		const contextText = await Utils.loadContextText()

		const systemPrompt = `Be sure to Format your response in JSON with the following format:
${JSON.stringify(responseSample)}`;

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const promptTemplate = EsmPromptTemplate`Here is a context between CONTEXT_BEGIN and CONTEXT_END:
CONTEXT_BEGIN
${"contextText"}
CONTEXT_END

Based on this context, answer the following question:
${"question"}`

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const datasetArray = await Utils.loadDatasetJson(evaluationName)
		const predictionArrayJson = /** @type {import("../src/type.d.js").PredictionJson} */([])

		for (const datasetItem of datasetArray) {
			const question = promptTemplate({ 
				contextText, 
				question: datasetItem.question 
			})

			console.log(`Question : ${CliColor.green(datasetItem.question)}`);
			const responseJson = await LlamaUtils.promptGrammarJsonOne(llamaContext, llamaGrammar, systemPrompt, question);
			console.log(`Answer : ${CliColor.cyan(responseJson.answer)}`)
			const predictionItemJson = /** @type {import("../src/type.d.js").PredictionItemJson} */({ predictedAnswer: responseJson.answer })
			predictionArrayJson.push(predictionItemJson)
		}

		if( options.verbose){
			console.log(`OUTPUT by ${CliColor.red(Path.basename(modelPath))}`)
			console.log(`${JSON.stringify(predictionArrayJson, null, '\t')}`)
	
		}

		// return predictionJson
		return predictionArrayJson
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Usage example
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync() {
	const modelName = AvailableModelPaths.LLAMA_2_7B_CHAT_Q2_K
	// const modelName = AvailableModelPaths.ZEPHYR_7B_ALPHA_Q6_K
	// const modelName = AvailableModelPaths.CODELLAMA_13B_INSTRUCT_Q3_K_M
	// await LlamaUtils.warmUpContext(llamaContext);

	const evaluationName = 'myeval'
	await DatasetPredictDirect.predict(modelName, evaluationName, {
		verbose: true
	})
}

// run mainAsync() if this file is run directly from node.js
import { fileURLToPath } from 'url';
const runAsMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (runAsMainModule) {
	// call mainAsync()
	await mainAsync()
}