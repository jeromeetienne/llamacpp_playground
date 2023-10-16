// node imports
import Path from "path";
import Fs from 'fs'

// npm imports
import Json5 from "json5";
import CliColor from "cli-color";

// langchain imports
import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAI } from "langchain/llms/openai";
import { LlamaCpp } from "langchain/llms/llama_cpp";
import { LLMChain } from "langchain/chains";

// local imports
import Utils from "../../src/utils.js";
import AvailableModelPaths from "../../src/available_model_paths.js";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {Object} DatasetPredictLangchainOptions
 * @property {Boolean} verbose
 * @property {string} prompt prompt in f-string e.g. "here is a context: {context}\nNow answer the following question: {question}"
 */

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default class DatasetPredictLangchain {

	/**
	 * @param {string} evaluationName
	 * @param {string} predictionName
	 * @param {string} modelName e.g. gpt-4-0613 gpt-3.5-turbo
	 * @param {Partial<DatasetPredictLangchainOptions>} partialOptions
	 */
	static async predict(evaluationName, predictionName, modelName, partialOptions = {}) {

		// handle default options
		partialOptions = Object.assign({}, /** @type {DatasetPredictLangchainOptions} */({
			verbose: false,
			prompt: `Here is a context between CONTEXT_BEGIN and CONTEXT_END:
CONTEXT_BEGIN
{context}
CONTEXT_END

Based on this context, answer the following question:
{question}`
		}), partialOptions)
		const options = /** @type {DatasetPredictLangchainOptions} */(partialOptions)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const lgModel = new OpenAI({
			modelName: modelName,
			// modelName: "gpt-3.5-turbo",
			temperature: 0
		});
		// const modelName = lgModel.modelName

		// const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
		// const modelName = Path.basename(modelPath)
		// const lgModel = new LlamaCpp({ modelPath });

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// debugger
		const promptTemplate = PromptTemplate.fromTemplate(options.prompt);


		const contextText = await Utils.loadContextText()
		const datasetJson = await Utils.loadDatasetJson(evaluationName)


		// const chain = promptTemplate.pipe(lgModel);
		const chain = new LLMChain({ llm: lgModel, prompt: promptTemplate });


		const predictionJson = /** @type {import("../../src/type.d.js").PredictionJson} */([])
		for (const datasetItem of datasetJson) {
			console.log(`Question : ${CliColor.green(datasetItem.question)}`);
			const result = await chain.call({
				context: contextText,
				question: datasetItem.question,
			});
			// debugger
			// @ts-ignore
			let outputText = /** @type {string} */(null)
			if (result.content) {
				outputText = result.content.trim()
			} else if (result.text) {
				outputText = result.text.trim()
			} else {
				// @ts-ignore
				outputText = /** @type {string} */(result)
				outputText = outputText.trim()
			}


			console.log(`Answer : ${CliColor.cyan(outputText)}`)
			const predictionItemJson = /** @type {import("../../src/type.d.js").PredictionItemJson} */({
				predictedAnswer: outputText
			})
			predictionJson.push(predictionItemJson)
		}

		if (options.verbose) {
			console.log(`OUTPUT by ${CliColor.red(modelName)}`)
			console.log(`${JSON.stringify(predictionJson, null, '\t')}`)
		}

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
	await DatasetPredictLangchain.predict(evaluationName, predictionName, modelName, {
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