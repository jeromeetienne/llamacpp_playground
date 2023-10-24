/**
 * - from https://js.langchain.com/docs/modules/model_io/models/llms/integrations/llama_cpp
 */

// npm imports
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
import Utils from "../utils.js";

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default class RecordGenerateLangchain {

	/**
	 * @typedef {Object} RecordGenerateLangchainOptions
	 * @property {number} recordCount use 0 if you dont want to specify
	 * @property {string} modelName
	 * @property {string} context
	 */

	static defaultOptions =  /** @type {RecordGenerateLangchainOptions} */({
		recordCount: 0,
		modelName: 'gpt-3.5-turbo',
		context: '',
	})

	/**
	 * @param {Zod.Schema} recordZodSchema 
	 * @param {Partial<RecordGenerateLangchainOptions>} partialOptions
	 */
	static async generateFromZod(recordZodSchema, partialOptions = {}) {

		// handle default options
		partialOptions = Object.fromEntries(Object.entries(partialOptions).filter(([k, v]) => v !== undefined));
		partialOptions = Object.assign({}, RecordGenerateLangchain.defaultOptions, partialOptions)
		const options = /** @type {RecordGenerateLangchainOptions} */(partialOptions)

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

		const systemPrompt = `Generate JSON Objects. each of them has:
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
		
Now based on this context, generate ${options.recordCount !== 0 ? options.recordCount + ' ' : ''}JSON Object${options.recordCount > 1 || options.recordCount === 0 ? 's' : ''} in a array.`

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
	// create record zod schema
	const recordZodSchema = Zod.object({
		question: Zod.string().describe('a short clear question based on the context'),
		answer: Zod.string().describe('the response to the question'),
	})
	// load the context we want to use
	const recordJson = await RecordGenerateLangchain.generateFromZod(recordZodSchema, {
		recordCount: 3,
		context: await Utils.loadContextStateUnion(),
	})
	console.log({ recordJson })

}

// run mainAsync() if this file is run directly from node.js
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) await mainAsync()