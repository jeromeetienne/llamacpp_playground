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
import Utils from "../../src/utils.js";
import AvailableModelPaths from "../../../../src/available_model_paths.js";
import EsmPromptTemplate from "../../src/esm-prompt-template.js";
import FstringTemplate from "../../src/fstring-template.js";

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
 * @property {string} modelName valid model basename for node-llama-cpp e.g. codellama-7b-instruct.Q4_K_M.gguf
 * @property {string} prompt prompt in f-string e.g. "here is a context: {context}\nNow answer the following question: {question}"
 * @property {Boolean} verbose
 */

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default class DatasetPredictDirect {

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	static defaultPredictOptions =  /** @type {DatasetPredictDirectOptions} */({
		modelName: AvailableModelPaths.MISTRAL_7B_INSTRUCT_V0_1_Q6_K,
		prompt: `Here is a context between CONTEXT_BEGIN and CONTEXT_END:
CONTEXT_BEGIN
{context}
CONTEXT_END

Based on this context, answer the following question:
{question}`,
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
	 * @param {Partial<DatasetPredictDirectOptions>} partialOptions
	 */
	static async predict(evaluationName, predictionName, partialOptions = {}) {

		// handle default options
		partialOptions = Object.fromEntries(Object.entries(partialOptions).filter(([k, v]) => v !== undefined));
		partialOptions = Object.assign({}, DatasetPredictDirect.defaultPredictOptions, partialOptions)
		const options = /** @type {DatasetPredictDirectOptions} */(partialOptions)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	init llamaModel and llamaContext
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const modelPath = Path.join(__dirname, '../../../../models', options.modelName)
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

		// TODO make it tunable
		const systemPrompt = `Be sure to Format your response in JSON with the following format:
${JSON.stringify(responseSample)}`;

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const promptTemplate = new FstringTemplate(options.prompt);

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const datasetArray = await Utils.loadDatasetJson(evaluationName)
		const predictionJson = /** @type {import("../../src/type.d.js").PredictionJson} */([])

		for (const datasetItem of datasetArray) {
			const question = promptTemplate.generate({
				context: contextText,
				question: datasetItem.question
			})

			console.log(`Question : ${CliColor.green(datasetItem.question)}`);
			const responseJson = await LlamaUtils.promptGrammarJsonOne(llamaContext, llamaGrammar, systemPrompt, question);
			console.log(`Answer : ${CliColor.cyan(responseJson.answer)}`)
			const predictionItemJson = /** @type {import("../../src/type.d.js").PredictionItemJson} */({ predictedAnswer: responseJson.answer })
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
	const modelName = AvailableModelPaths.LLAMA_2_7B_CHAT_Q2_K
	// const modelName = AvailableModelPaths.ZEPHYR_7B_ALPHA_Q6_K
	// const modelName = AvailableModelPaths.CODELLAMA_13B_INSTRUCT_Q3_K_M
	// await LlamaUtils.warmUpContext(llamaContext);

	const evaluationName = 'myeval'
	const predictionName = 'basic'
	await DatasetPredictDirect.predict(evaluationName, predictionName, {
		modelName: modelName,
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