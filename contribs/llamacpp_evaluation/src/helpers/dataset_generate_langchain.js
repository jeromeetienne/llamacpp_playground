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
import { HumanMessage, SystemMessage } from "langchain/schema";
import { OpenAI } from "langchain/llms/openai";
import { LlamaCpp } from "langchain/llms/llama_cpp";
import { LLMChain } from "langchain/chains";
import { StructuredOutputParser, OutputFixingParser } from "langchain/output_parsers";

// local imports
// import LlamaUtils from "../../src/llama-utils.js";
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
 * @typedef {Object} DatasetGenerateLangchainOptions
 * @property {string} modelName
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
export default class DatasetGenerateLangchain {

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	static defaultGenerateOptions =  /** @type {DatasetGenerateLangchainOptions} */({
		modelName: 'gpt-3.5-turbo',
		verbose: false,
	})

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * @param {number} nItems
	 */
	static async generateBasicQa(nItems) {
		// generate fixtures
		const fixtureZodSchema = Zod.object({
			question: Zod.string().describe('a short simple question'),
			answer: Zod.string().describe('the response to the question'),
		})
		const fixturesJson = await DatasetGenerateLangchain._generateRecordsFromZod(nItems, fixtureZodSchema)

		// convert fixturesJson to datasetJson
		const datasetJson = /** @type {import("../../src/type.d.js").DatasetJson} */([])
		for (const fixtureJson of fixturesJson) {
			const datasetItemJson = /** @type {import("../../src/type.d.js").DatasetItemJson} */({
				userInput: fixtureJson.question,
				expectedResponse: fixtureJson.answer,
				context: '',
			})
			datasetJson.push(datasetItemJson)
		}

		// return datasetJson
		return datasetJson
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * @param {number} nItems
	 */
	static async generateTranslateFrench(nItems) {
		// generate fixtures
		const fixtureZodSchema = Zod.object({
			sentence: Zod.string().describe('a short simple sentence'),
			frenchSentence: Zod.string().describe('the french translation of the sentence'),
		})
		const fixturesJson = await DatasetGenerateLangchain._generateRecordsFromZod(nItems, fixtureZodSchema)

		// convert fixturesJson to datasetJson
		const datasetJson = /** @type {import("../../src/type.d.js").DatasetJson} */([])
		for (const fixtureJson of fixturesJson) {
			const datasetItemJson = /** @type {import("../../src/type.d.js").DatasetItemJson} */({
				userInput: fixtureJson.sentence,
				expectedResponse: fixtureJson.frenchSentence,
				context: '',
			})
			datasetJson.push(datasetItemJson)
		}

		// return datasetJson
		return datasetJson
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * @param {number} nItems
	 * @param {Partial<DatasetGenerateLangchainOptions>} partialOptions
	 */
	static async generateStateUnionQa(nItems, partialOptions = {}) {

		// handle default options
		partialOptions = Object.fromEntries(Object.entries(partialOptions).filter(([k, v]) => v !== undefined));
		partialOptions = Object.assign({}, DatasetGenerateLangchain.defaultGenerateOptions, partialOptions)
		const options = /** @type {DatasetGenerateLangchainOptions} */(partialOptions)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	init parameters
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// create record zod schema
		const recordZodSchema = Zod.object({
			question: Zod.string().describe('a short clear question based on the context'),
			answer: Zod.string().describe('the response to the question'),
		})
		// load the context we want to use
		const context = await Utils.loadContextStateUnion()

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	generate recordsJson
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// generate recordsJson
		const recordsJson = await DatasetGenerateLangchain._generateRecordsFromZod(nItems, recordZodSchema, {
			context: context,
			modelName: options.modelName,
		})

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	Convert recordsJson to datasetJson
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// build datasetJson
		const datasetJson = /** @type {import("../../src/type.d.js").DatasetJson} */([])
		for (const record of recordsJson) {
			const datasetItemJson = /** @type {import("../../src/type.d.js").DatasetItemJson} */({
				userInput: record.question,
				expectedResponse: record.answer,
				context: context,
			})
			datasetJson.push(datasetItemJson)
		}

		if (options.verbose) {
			console.log(`Response : ${CliColor.cyan(JSON.stringify(recordsJson, null, '\t'))}`)
		}

		// return datasetJson
		return datasetJson
	}


// 	///////////////////////////////////////////////////////////////////////////////
// 	///////////////////////////////////////////////////////////////////////////////
// 	//	
// 	///////////////////////////////////////////////////////////////////////////////
// 	///////////////////////////////////////////////////////////////////////////////

// 	/**
// 	 * @param {number} nItems
// 	 * @param {Partial<DatasetGenerateLangchainOptions>} partialOptions
// 	 */
// 	static async generateStateUnionQaOld(nItems, partialOptions = {}) {

// 		// handle default options
// 		partialOptions = Object.fromEntries(Object.entries(partialOptions).filter(([k, v]) => v !== undefined));
// 		partialOptions = Object.assign({}, DatasetGenerateLangchain.defaultGenerateOptions, partialOptions)
// 		const options = /** @type {DatasetGenerateLangchainOptions} */(partialOptions)

// 		///////////////////////////////////////////////////////////////////////////////
// 		///////////////////////////////////////////////////////////////////////////////
// 		//	
// 		///////////////////////////////////////////////////////////////////////////////
// 		///////////////////////////////////////////////////////////////////////////////

// 		const lgModel = new OpenAI({
// 			modelName: options.modelName,
// 			temperature: 0,
// 			verbose: true,
// 		});
// 		// const modelName = lgModel.modelName

// 		// const modelPath = Path.join(__dirname, '../../../../models', ModelPathContants.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
// 		// const modelName = Path.basename(modelPath)
// 		// const lgModel = new LlamaCpp({ modelPath });

// 		// debugger

// 		///////////////////////////////////////////////////////////////////////////////
// 		///////////////////////////////////////////////////////////////////////////////
// 		//	
// 		///////////////////////////////////////////////////////////////////////////////
// 		///////////////////////////////////////////////////////////////////////////////

// 		/**
// 		 * @typedef {object} ResponseItemJson
// 		 * @property {string} question
// 		 * @property {string} answer
// 		 */
// 		/**
// 		 * @typedef {ResponseItemJson[]} ResponseJson
// 		 */

// 		const responseZodSchema = Zod.array(Zod.object({
// 			question: Zod.string(),
// 			answer: Zod.string(),
// 		}))
// 		const outputParser = StructuredOutputParser.fromZodSchema(responseZodSchema);
// 		// const outputFixingModel = new LlamaCpp({ 
// 		// 	modelPath : Path.join(__dirname, '../../../../models', ModelPathContants.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
// 		// });
// 		// const outputFixingModel = lgModel
// 		const outputFixingModel = new OpenAI({
// 			temperature: 0,
// 		});
// 		const outputFixingParser = OutputFixingParser.fromLLM(outputFixingModel, outputParser);

// 		// const outputFixingModel = 
// 		// const modelPath = Path.join(__dirname, '../../../../models', ModelPathContants.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
// 		// const modelName = Path.basename(modelPath)


// 		// debugger
// 		const promptTemplate = PromptTemplate.fromTemplate(
// 			`{outputFormatInstructions}

// Here is a context between CONTEXT_BEGIN and CONTEXT_END:
// CONTEXT_BEGIN
// {contextText}
// CONTEXT_END

// Please generate {nQuestions} question/answer tuples about this context
// - make your questions are clear and simple
// - make your answers short and factual
// - make sure the question can be answered by only reading the context
// `
// 		);


// 		const contextText = await Utils.loadContextStateUnion()

// 		///////////////////////////////////////////////////////////////////////////////
// 		///////////////////////////////////////////////////////////////////////////////
// 		//	
// 		///////////////////////////////////////////////////////////////////////////////
// 		///////////////////////////////////////////////////////////////////////////////


// 		const chain = new LLMChain({
// 			llm: lgModel,
// 			prompt: promptTemplate,
// 			outputParser: outputFixingParser,
// 		});

// 		const result = await chain.call({
// 			contextText: contextText,
// 			outputFormatInstructions: outputParser.getFormatInstructions(),
// 			// outputFormatInstructions: '',
// 			nQuestions: nItems,
// 		});

// 		// @ts-ignore
// 		let outputText = /** @type {string} */(null)
// 		if (result.content) {
// 			outputText = result.content.trim()
// 		} else if (result.text instanceof Object) {
// 			outputText = JSON.stringify(result.text, null, '\t')
// 		} else if (typeof result.text === 'string') {
// 			outputText = result.text.trim()
// 		} else {
// 			// @ts-ignore
// 			outputText = /** @type {string} */(result)
// 			outputText = outputText
// 		}

// 		const responseJson = /** @type {ResponseJson} */(Json5.parse(outputText))

// 		// build datasetJson
// 		const datasetJson = /** @type {import("../../src/type.d.js").DatasetJson} */([])
// 		for (const responseItem of responseJson) {
// 			const datasetItemJson = /** @type {import("../../src/type.d.js").DatasetItemJson} */({
// 				userInput: responseItem.question,
// 				expectedResponse: responseItem.answer,
// 				context: contextText,
// 			})
// 			datasetJson.push(datasetItemJson)
// 		}


// 		if (options.verbose) {
// 			console.log(`OUTPUT by ${CliColor.red(options.modelName)}: ${datasetJson.length} items`)
// 			console.log(datasetJson)
// 			console.log()
// 		}


// 		// return datasetJson
// 		return datasetJson
// 	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * @param {number} recordCount
	 * @param {Zod.Schema} recordZodSchema 
	 * @param {object} partialOptions
	 * @param {string=} partialOptions.modelName
	 * @param {string=} partialOptions.context
	 */
	static async _generateRecordsFromZod(recordCount, recordZodSchema, partialOptions = {}) {
		// handle default options
		partialOptions = Object.fromEntries(Object.entries(partialOptions).filter(([k, v]) => v !== undefined));
		const options = Object.assign({}, {
			modelName: 'gpt-3.5-turbo',
			context: '',
		}, partialOptions)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// convert zodSchema to jsonSchema
		let fixtureJsonSchemaTyped = zodToJsonSchema(recordZodSchema)
		let fixtureJsonSchema = /** @type {object} */(JSON.parse(JSON.stringify(fixtureJsonSchemaTyped)))
		// 
		const fixtureProperties = /** @type {Object<string, string>} */({})
		Object.keys(fixtureJsonSchema.properties).forEach(property => {
			fixtureProperties[property] = fixtureJsonSchema.properties[property].description
		})

		// format the instructions
		let formatInstruction = ''
		Object.keys(fixtureProperties).forEach(property => {
			formatInstruction += `- ${property}: <${fixtureProperties[property].toUpperCase()}>\n`
		})
		formatInstruction = formatInstruction.trim()

		const systemPrompt = `Generate ${recordCount} JSON objects. each of them has:
${formatInstruction}

Format your response as a JSON array.`


		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////


		const messages = [
			new SystemMessage(systemPrompt),
		]

		// add a human message if there is a context
		if (options.context) {
			const userPrompt = `${options.context}
		
Now based on this context, generate ${recordCount} JSON Object${recordCount > 1 ? 's' : ''} in a array.`
			messages.push(new HumanMessage(userPrompt))
		}

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// Create the model
		const lgModel = new ChatOpenAI({
			modelName: options.modelName,
			temperature: 0,
			// verbose: true,
		});

		// call the model
		const result = await lgModel.call(messages)

		const outputText = result.text.trim()
		const responseUntypedJson = Json5.parse(outputText)
		const responseZodSchema = Zod.array(recordZodSchema)
		const responseJson = responseZodSchema.parse(responseUntypedJson)

		return responseJson
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Usage example
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync() {
	// // create record zod schema
	// const recordZodSchema = Zod.object({
	// 	question: Zod.string().describe('a short clear question based on the context'),
	// 	answer: Zod.string().describe('the response to the question'),
	// })
	// // load the context we want to use
	// const context = await Utils.loadContextStateUnion()
	// const recordCount = 3
	// const recordJson = await DatasetGenerateLangchain._generateRecordsFromZod(recordCount, recordZodSchema, {
	// 	context: context,
	// })
	// console.log({ recordJson })
	// debugger

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// const datasetBasicQa = await DatasetGenerateLangchain.generateBasicQa(3)
	// console.log({ datasetBasicQa })

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	
	const modelName = 'gpt-3.5-turbo'
	const datasetStateUnionQa = await DatasetGenerateLangchain.generateStateUnionQa(3, {
		modelName: modelName,
		verbose: true
	})
	// console.log({ datasetBasicQa })
}

// run mainAsync() if this file is run directly from node.js
import { fileURLToPath } from 'url';
const runAsMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (runAsMainModule) {
	// call mainAsync()
	await mainAsync()
}