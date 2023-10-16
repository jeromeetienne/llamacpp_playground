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

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {Object} DatasetGenerateDirectOptions
 * @property {number} nQuestions
 * @property {Boolean} verbose
 */

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default class DatasetGenerateDirect {

	/**
	 * 
	 * @param {string} modelName 
	 * @param {string} evaluationName
	 * @param {Partial<DatasetGenerateDirectOptions>} partialOptions
	 */
	static async generate(modelName, evaluationName, partialOptions = {}) {

		// handle default options
		partialOptions = Object.assign({}, /** @type {DatasetGenerateDirectOptions} */({
			nQuestions: 1,
			verbose: false,
		}), partialOptions)
		const options = /** @type {DatasetGenerateDirectOptions} */(partialOptions)


		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		

		const modelPath = Path.join(__dirname, '../models', modelName)
		const { llamaContext } = await LlamaUtils.initModelAndContext(modelPath)
	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	build llama grammar
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		/**
		 * @typedef {object} ResponseItemJson
		 * @property {string} question
		 * @property {string} trueAnswer
		 */
		/**
		 * @typedef {object} ResponseJson
		 * @property {ResponseItemJson[]} items
		 */

		const responseZodSchema = Zod.array(Zod.object({
			question: Zod.string(),
			trueAnswer: Zod.string(),
		}))

		const responseJsonSchemaFull = zodToJsonSchema(responseZodSchema, "responseJsonSchema");
		const responseJsonSchema = /** @type {Object} */(responseJsonSchemaFull.definitions?.['responseJsonSchema'])
		const responseSample = [{ "question": "What is your name?", "trueAnswer": "My name is John." }, { "question": "What do you like?", "trueAnswer": "I like blue." }]
		console.assert(responseZodSchema.parse(responseSample) !== undefined, `responseSample should be valid`);
		const llamaGrammar = new LlamaJsonSchemaGrammar(responseJsonSchema)
		// const llamaGrammar = await LlamaGrammar.getFor("json");
		// console.log(`reponse json-schema ${JSON.stringify(responseJsonSchema, null, 2)}`)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	load context
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const contextText = await Utils.loadContextText()

		// const contextText = `My name is john, i like blue and eat sausages. i speak french and i listen to rock.`

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	build systemPrompt and question
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const systemPrompt = `Be sure to format your response in JSON with the following format:
	${JSON.stringify(responseSample)}`;

		const question = `Here is a context between CONTEXT_BEGIN and CONTEXT_END:
	CONTEXT_BEGIN
	${contextText}
	CONTEXT_END
	
	Please generate ${options.nQuestions} question/answer tuples about this context
	- make your questions are short and clear
	- make your answers short and factual
	- make sure the question can be fully answered only by reading the context`;

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		if (options.verbose) {
			console.log(`System Prompt : ${CliColor.green(systemPrompt)}`);
			console.log(`Question : ${CliColor.green(question)}`);
		}

		const responseJson = await LlamaUtils.promptGrammarJsonOne(llamaContext, llamaGrammar, systemPrompt, question, true);
		const datasetJson = /** @type {import("../src/type.d.js").DatasetArrayJson} */(responseJson)

		if (options.verbose) {
			console.log(`Response : ${CliColor.cyan(JSON.stringify(responseJson, null, '\t'))}`)
		}

		// return datasetJson
		return datasetJson
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Usage example
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync() {
	const modelName = AvailableModelPaths.CODELLAMA_13B_INSTRUCT_Q3_K_M
	await DatasetGenerateDirect.generate(modelName, {
		nQuestions: 3,
		verbose: true,
	})
}

// run mainAsync() if this file is run directly from node.js
import { fileURLToPath } from 'url';
const runAsMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (runAsMainModule) {
	// call mainAsync()
	await mainAsync()
}