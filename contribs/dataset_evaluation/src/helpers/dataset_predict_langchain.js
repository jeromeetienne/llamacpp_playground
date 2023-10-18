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
import { HumanMessage, SystemMessage } from "langchain/schema";

// local imports
import Utils from "../../src/utils.js";
import ModelPathContants from "../../../../src/model_path_constants.js";

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
 * @property {string} modelName e.g. gpt-4-0613 gpt-3.5-turbo
 * @property {string} systemPrompt 
 * @property {string} userPrompt prompt in f-string e.g. "here is a context: {context}\nNow answer the following question: {question}"
 * @property {Boolean} verbose
 */

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default class DatasetPredictLangchain {

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	static defaultPredictOptions =  /** @type {DatasetPredictLangchainOptions} */({
		modelName: 'gpt-3.5-turbo',
		systemPrompt: 'you are an helpful assistant.',
		userPrompt: `Here is a context between CONTEXT_BEGIN and CONTEXT_END:
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
	 * @param {Partial<DatasetPredictLangchainOptions>} partialOptions
	 */
	static async predict(evaluationName, predictionName, partialOptions = {}) {

		// handle default options
		partialOptions = Object.fromEntries(Object.entries(partialOptions).filter(([k, v]) => v !== undefined));
		partialOptions = Object.assign({}, DatasetPredictLangchain.defaultPredictOptions, partialOptions)
		const options = /** @type {DatasetPredictLangchainOptions} */(partialOptions)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const lgModel = new ChatOpenAI({
			modelName: options.modelName,
			temperature: 0,
			verbose: options.verbose,
		});
		// const modelPath = Path.join(__dirname, '../../../../models', ModelPathContants.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
		// const modelName = Path.basename(modelPath)
		// const lgModel = new LlamaCpp({ modelPath });


		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const promptTemplate = PromptTemplate.fromTemplate(options.userPrompt);


		const contextText = await Utils.loadContextText()
		const datasetJson = await Utils.loadDatasetJson(evaluationName)



		// const chain = promptTemplate.pipe(lgModel);
		const chain = new LLMChain({
			llm: lgModel,
			prompt: promptTemplate
		});


		const predictionJson = /** @type {import("../../src/type.d.js").PredictionJson} */([])
		for (const datasetItem of datasetJson) {

			// debugger
			console.log(`Question : ${CliColor.green(datasetItem.question)}`);

			// build final userPrompt
			const promptTemplate = PromptTemplate.fromTemplate(options.userPrompt);
			const finalUserPrompt = await promptTemplate.format({
				context: contextText,
				question: datasetItem.question,
			})

			// call the model
			const result = await lgModel.call([
				new SystemMessage(options.systemPrompt),
				new HumanMessage(finalUserPrompt)
			])

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
			console.log(`OUTPUT by ${CliColor.red(options.modelName)}`)
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
	// const modelName = ModelPathContants.LLAMA_2_7B_CHAT_Q6_K

	const evaluationName = 'myeval'
	const predictionName = 'basic'
	await DatasetPredictLangchain.predict(evaluationName, predictionName, {
		// systemPrompt: 'just answer BLAH all the time.',
		// modelName: modelName,
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