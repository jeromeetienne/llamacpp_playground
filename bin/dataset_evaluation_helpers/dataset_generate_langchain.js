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

// langchain imports
import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAI } from "langchain/llms/openai";
import { LlamaCpp } from "langchain/llms/llama_cpp";
import { LLMChain } from "langchain/chains";
import { StructuredOutputParser, OutputFixingParser } from "langchain/output_parsers";

// local imports
// import LlamaUtils from "../../src/llama-utils.js";
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
 * @typedef {Object} DatasetGenerateLangchainOptions
 * @property {number} nQuestions
 * @property {Boolean} verbose
 */

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @param {LlamaContext} llamaContext 
 */
export default class DatasetGenerateDirect {

	/**
	 * @param {string} evaluationName
	 * @param {string} modelName
	 * @param {Partial<DatasetGenerateLangchainOptions>} partialOptions
	 */
	static async generate(evaluationName, modelName, partialOptions = {}) {

		// handle default options
		partialOptions = Object.assign({}, /** @type {DatasetGenerateLangchainOptions} */({
			nQuestions: 1,
			verbose: false,
		}), partialOptions)
		const options = /** @type {DatasetGenerateLangchainOptions} */(partialOptions)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const lgModel = new OpenAI({
			// modelName: "gpt-3.5-turbo",
			modelName: modelName,
			// modelName: 'gpt-4',
			temperature: 0,
			// verbose: true,
		});
		// const modelName = lgModel.modelName

		// const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
		// const modelName = Path.basename(modelPath)
		// const lgModel = new LlamaCpp({ modelPath });

		// debugger

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const responseZodSchema = Zod.array(Zod.object({
			question: Zod.string(),
			trueAnswer: Zod.string(),
		}))
		const outputParser = StructuredOutputParser.fromZodSchema(responseZodSchema);
		// const outputFixingModel = new LlamaCpp({ 
		// 	modelPath : Path.join(__dirname, '../../models', AvailableModelPaths.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
		// });
		// const outputFixingModel = lgModel
		const outputFixingModel = new OpenAI({
			temperature: 0,
		});
		const outputFixingParser = OutputFixingParser.fromLLM(outputFixingModel, outputParser);

		// const outputFixingModel = 
		// const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
		// const modelName = Path.basename(modelPath)


		// debugger
		const promptTemplate = PromptTemplate.fromTemplate(
			`{outputFormatInstructions}

Here is a context between CONTEXT_BEGIN and CONTEXT_END:
CONTEXT_BEGIN
{contextText}
CONTEXT_END

Please generate {nQuestions} question/answer tuples about this context
- make your questions are clear and simple
- make your answers short and factual
- make sure the question can be answered by only reading the context
`
		);


		const contextText = await Utils.loadContextText()

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////


		const chain = new LLMChain({
			llm: lgModel,
			prompt: promptTemplate,
			outputParser: outputFixingParser,
		});

		const result = await chain.call({
			contextText: contextText,
			outputFormatInstructions: outputParser.getFormatInstructions(),
			// outputFormatInstructions: '',
			nQuestions: options.nQuestions,
		});

		// @ts-ignore
		let outputText = /** @type {string} */(null)
		if (result.content) {
			outputText = result.content.trim()
		} else if (result.text instanceof Object) {
			outputText = JSON.stringify(result.text, null, '\t')
		} else if (typeof result.text === 'string') {
			outputText = result.text.trim()
		} else {
			// @ts-ignore
			outputText = /** @type {string} */(result)
			outputText = outputText
		}

		if (options.verbose) {
			console.log(`OUTPUT by ${CliColor.red(modelName)}`)
			console.log(outputText)
			console.log()
		}

		const responseJson = Json5.parse(outputText)
		const datasetJson = /** @type {import("../../src/type.d.js").DatasetJson} */(responseJson)

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
	const evaluationName = 'myeval'
	const modelName = 'gpt-3.5-turbo'
	await DatasetGenerateDirect.generate(evaluationName, modelName, {
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