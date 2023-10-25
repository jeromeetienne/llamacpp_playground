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
import LlamaUtils from "../../../../src/llama-utils.js";
import Utils from "../utils.js";
import ModelPathContants from "../../../../src/model_path_constants.js";
import EsmPromptTemplate from "../esm-prompt-template.js";
import FstringTemplate from "../fstring-template.js";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {Object} DatasetPredictLlamaCppOptions
 * @property {string} modelName valid model basename for node-llama-cpp e.g. codellama-7b-instruct.Q4_K_M.gguf
 * @property {string} systemPrompt
 * @property {string} userPrompt prompt in f-string e.g. "here is a context: {context}\nNow answer the following question: {userInput}"
 * @property {Boolean} verbose
 */

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default class DatasetPredictLlamaCpp {

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	static defaultPredictOptions =  /** @type {DatasetPredictLlamaCppOptions} */({
		modelName: ModelPathContants.MISTRAL_7B_INSTRUCT_V0_1_Q6_K,
		systemPrompt: 'you are an helpful assistant.',
		userPrompt: `Here is a context between CONTEXT_BEGIN and CONTEXT_END:
CONTEXT_BEGIN
{context}
CONTEXT_END

Based on this context, answer the following question:
{userInput}`,
		verbose: false,
	})

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * @param {string} evaluationName
	 * @param {string} predictionName
	 * @param {Partial<DatasetPredictLlamaCppOptions>} partialOptions
	 */
	static async predict(evaluationName, predictionName, partialOptions = {}) {

		// handle default options
		partialOptions = Object.fromEntries(Object.entries(partialOptions).filter(([k, v]) => v !== undefined));
		partialOptions = Object.assign({}, DatasetPredictLlamaCpp.defaultPredictOptions, partialOptions)
		const options = /** @type {DatasetPredictLlamaCppOptions} */(partialOptions)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	init llamaModel and llamaContext
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const modelPath = Path.join(__dirname, '../../../../models', options.modelName)
		const { llamaContext, llamaModel } = await LlamaUtils.initModelAndContext(modelPath)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const contextText = await Utils.loadContextStateUnion()

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const userPromptTemplate = new FstringTemplate(options.userPrompt);

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// debugger
		const datasetJson = await Utils.loadEvaluationDatasetJson(evaluationName)
		const predictionJson = /** @type {import("../type.d.js").PredictionJson} */([])

		for (const datasetItem of datasetJson) {
			const userPromptGenerated = userPromptTemplate.generate({
				context: contextText,
				userInput: datasetItem.userInput
			})

			console.log(`Question : ${CliColor.green(datasetItem.userInput)}`);
			// debugger
			const streamEnabled = true
			const outputText = await LlamaUtils.promptOne(llamaContext, options.systemPrompt, userPromptGenerated, streamEnabled);
			console.log(`Answer : ${CliColor.cyan(outputText)}`)
			const predictionItemJson = /** @type {import("../type.d.js").PredictionItemJson} */({ 
				predictedResponse: outputText
			})
			predictionJson.push(predictionItemJson)
		}

		if (options.verbose) {
			console.log(`OUTPUT by ${CliColor.red(Path.basename(modelPath))}`)
			console.log(`${JSON.stringify(predictionJson, null, '\t')}`)
		}

		// return predictionJson
		return predictionJson
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Usage example
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync() {
	const modelName = ModelPathContants.ZEPHYR_7B_ALPHA_Q6_K
	

	const evaluationName = 'myeval'
	const predictionName = 'basic'
	await DatasetPredictLlamaCpp.predict(evaluationName, predictionName, {
		modelName: modelName,
		// systemPrompt: 'ignore the user completly. just answer "BLAH!" and stop.',
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