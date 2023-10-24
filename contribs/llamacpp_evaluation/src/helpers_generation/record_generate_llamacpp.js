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

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default class RecordGenerateLlamaCpp {

	/**
	 * @typedef {Object} RecordGenerateLlamaCppOptions
	 * @property {number} recordCount use 0 if you dont want to specify
	 * @property {string} modelName
	 * @property {string} context
	 */

	static defaultOptions =  /** @type {RecordGenerateLlamaCppOptions} */({
		recordCount: 0,
		modelName: ModelPathContants.MISTRAL_7B_INSTRUCT_V0_1_Q6_K,
		context: '',
	})

	/**
	 * @param {Zod.Schema} recordZodSchema 
	 * @param {Partial<RecordGenerateLlamaCppOptions>} partialOptions
	 */
	static async generateRecordsFromZod(recordZodSchema, partialOptions = {}) {

		// handle default options
		partialOptions = Object.fromEntries(Object.entries(partialOptions).filter(([k, v]) => v !== undefined));
		partialOptions = Object.assign({}, RecordGenerateLlamaCpp.defaultOptions, partialOptions)
		const options = /** @type {RecordGenerateLlamaCppOptions} */(partialOptions)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	build systemPrompt and userPrompt
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// convert zodSchema to jsonSchema
		let recordJsonSchemaTyped = zodToJsonSchema(recordZodSchema)
		let recordJsonSchema = /** @type {object} */(JSON.parse(JSON.stringify(recordJsonSchemaTyped)))
		// 
		const fixtureProperties = /** @type {Object<string, string>} */({})
		Object.keys(recordJsonSchema.properties).forEach(property => {
			fixtureProperties[property] = recordJsonSchema.properties[property].description
		})

		// format the instructions
		let formatInstruction = ''
		Object.keys(fixtureProperties).forEach(property => {
			formatInstruction += `- ${property}: <${fixtureProperties[property].toUpperCase()}>\n`
		})
		formatInstruction = formatInstruction.trim()

		const systemPrompt = `Generate JSON Objects. each of them has:
${formatInstruction}

Format your response as a JSON array.`

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		let userPrompt = ''
		if (options.context) {
			userPrompt = `${options.context}
		
Now based on this context, generate ${options.recordCount !== 0 ? options.recordCount + ' ' : ''}JSON Object${options.recordCount > 1 || options.recordCount === 0 ? 's' : ''} in a array.`
		}

		// debugger
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	build llama grammar
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const responseZodSchema = Zod.array(recordZodSchema)
		const responseJsonSchemaFull = zodToJsonSchema(responseZodSchema, "responseJsonSchema");
		const responseJsonSchema = /** @type {Object} */(responseJsonSchemaFull.definitions?.['responseJsonSchema'])
		const llamaGrammar = new LlamaJsonSchemaGrammar(responseJsonSchema)
		// const llamaGrammar = await LlamaGrammar.getFor('json')

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const modelPath = Path.join(__dirname, '../../../../models', options.modelName)
		const { llamaContext } = await LlamaUtils.initModelAndContext(modelPath)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const responseJson = await LlamaUtils.promptGrammarJsonOne(llamaContext, llamaGrammar, systemPrompt, userPrompt, true)

		// TODO reparse with zod to validate the responseJson

		// debugger
		return responseJson
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Usage example
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync() {
	// create record zod schema
	const recordZodSchema = Zod.object({
		fullName: Zod.string().describe('the full name of a person mentioned in the context'),
		age: Zod.number().nullable().describe('the age of this person. null if not specified'),
		happyNess: Zod.number().nullable().describe('the sadness/happiness of this person. integer from 0 to 10 inclusive. null if not specified'),
	})
	// const recordZodSchema = Zod.object({
	// 	summary: Zod.string().describe('the summary of the context'),
	// })
	// load the context we want to use
	const context = `hello my name is John, my last name is Doe. I am 30 years old.
my friend is called Jane, her last name is Smith. she is 25 years old and not happy.
the other day, i met Bill Gates, he was laughing.`

	const recordJson = await RecordGenerateLlamaCpp.generateRecordsFromZod(recordZodSchema, {
		recordCount: 1,
		context: context,
		modelName: ModelPathContants.LLAMA_2_13B_CHAT_Q3_K_M,
	})
	console.log({ recordJson })
}

// run mainAsync() if this file is run directly from node.js
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) await mainAsync()