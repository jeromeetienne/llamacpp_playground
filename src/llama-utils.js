// node imports
import Path from "path";
import Fs from 'fs'

// npm imports
import { LlamaModel, LlamaContext, LlamaChatSession, LlamaGrammar, LlamaJsonSchemaGrammar, LlamaChatPromptWrapper } from "node-llama-cpp";
import Json5 from "json5";
import CliColor from "cli-color";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));
export default class LlamaUtils {


	/**
	 * 
	 * @param {LlamaContext} llamaContext 
	 * @param {string} systemPrompt 
	 * @param {string} userPrompt 
	 * @param {object} options
	 * @param {boolean=} options.streamEnabled
	 * @param {LlamaGrammar=} options.llamaGrammar
	 * @param {boolean=} options.jsonCleanup
	 * @param {number=} options.temperature
	 * @returns {Promise<string>} the generated text
	 */
	static async promptGeneric(llamaContext, systemPrompt, userPrompt, options = {}) {

		// handle default options
		options = Object.fromEntries(Object.entries(options).filter(([k, v]) => v !== undefined));
		options = Object.assign({}, {
			streamEnabled: false,
			llamaGrammar: null,
			temperature: 0,
		}, options)


		// console.log(`User : ${CliColor.green(question)}`);
		// console.log(`Ai : computing...`)

		const llamaSession = new LlamaChatSession({
			context: llamaContext,
			promptWrapper: new LlamaChatPromptWrapper(),
			systemPrompt: systemPrompt,

		});
		const promptOptions = /** @type {import("node-llama-cpp").LLamaChatPromptOptions} */({
			maxTokens: llamaContext.getContextSize(),
			/**
			 * 
			 * @param {import("node-llama-cpp").Token[]} chunk 
			 */
			onToken(chunk) {
				if (options.streamEnabled === false) return
				// display the tokens as they are generated
				process.stdout.write(llamaContext.decode(chunk));
			},
			temperature: options.temperature,
		})
		if (options.llamaGrammar !== null) {
			promptOptions.grammar = options.llamaGrammar
		}
		const response = await llamaSession.promptWithMeta(userPrompt, promptOptions);
		let responseText = response.text
		// console.log(`Ai : ${CliColor.cyan(response.text)}`)

		// console.log(`End computing...`)
		if (options.streamEnabled === true) {
			process.stdout.write('\n')
		}

		// honor jsonCleanup option
		if (options.jsonCleanup === true) {
			responseText = LlamaUtils.jsonCleanup(responseText)
		}

		return responseText
	}

	/**
	 * return a string parsabled by JSON.parse(), "by all means necessary"
	 * It is use for ouput post-processing of the AI response which are supposed to return JSON
	 * 
	 * @param {string} originalJsonText 
	 */
	static jsonCleanup(originalJsonText) {
		let jsonText = originalJsonText
		// sometime the text contains invalid double quotes
		jsonText = jsonText.replace(/”/g, '"')

		// if it is already valid JSON, return it
		if (isJson(jsonText) === true) return jsonText
		// if it is already valid JSON5, return it
		if (isJson5(jsonText) === true) {
			const json5Text = Json5.parse(jsonText)
			return JSON.stringify(json5Text)
		}

		// handle code block in markdown
		const codeBlockSplits = jsonText.split(/[\n]?```/)
		const hasMarkdownCodeBlock = codeBlockSplits.length > 1
		if (hasMarkdownCodeBlock === true) {
			let firstCodeBlock = codeBlockSplits[1].trim()
			// remove a language specifier 'json' if present
			// ```json
			// {a: "b"}
			// ```
			firstCodeBlock = firstCodeBlock.replace(/^json/, '')
			jsonText = firstCodeBlock
		}


		// if it is already valid JSON, return it
		if (isJson(jsonText) === true) return jsonText
		// if it is already valid JSON5, return it
		if (isJson5(jsonText) === true) {
			const json5Text = Json5.parse(jsonText)
			return JSON.stringify(json5Text)
		}

		// if it is not valid JSON here, we cant do anything
		if (isJson(jsonText) === false){
			console.log(`originalJsonText: ${originalJsonText}`)
			// console.log(`jsonText: ${jsonText}`)
			throw new Error(`jsonText is not valid JSON`)
		}

		return jsonText

		/**
		 * 
		 * @param {string} jsonText 
		 * @returns 
		 */
		function isJson(jsonText) {
			try {
				JSON.parse(jsonText);
			} catch (e) {
				return false;
			}
			return true;
		}

		/**
		 * 
		 * @param {string} jsonText 
		 * @returns 
		 */
		function isJson5(jsonText) {
			try {
				Json5.parse(jsonText);
			} catch (e) {
				return false;
			}
			return true;
		}
	}


	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {LlamaContext} llamaContext 
	 * @param {string} systemPrompt 
	 * @param {string} userPrompt 
	 */
	static async promptOne(llamaContext, systemPrompt, userPrompt, streamEnabled = false) {
		// console.log(`User : ${CliColor.green(question)}`);
		// console.log(`Ai : computing...`)

		// FIXME use LlamaUtils.promptGeneric() instead
		console.error('use LlamaUtils.promptGeneric() instead')

		// debugger
		const llamaSession = new LlamaChatSession({
			context: llamaContext,
			// promptWrapper: new LlamaChatPromptWrapper(),
			systemPrompt: systemPrompt,

		});
		const promptOptions = /** @type {import("node-llama-cpp").LLamaChatPromptOptions} */({
			maxTokens: llamaContext.getContextSize(),
			/**
			 * 
			 * @param {import("node-llama-cpp").Token[]} chunk 
			 */
			onToken(chunk) {
				if (streamEnabled === false) return
				// display the tokens as they are generated
				const decodedChunk = llamaContext.decode(chunk)
				process.stdout.write(CliColor.yellow(decodedChunk));
			},
			temperature: 0,
		})
		const response = await llamaSession.promptWithMeta(userPrompt, promptOptions);
		const outputText = response.text

		if (streamEnabled === true) {
			process.stdout.write('\n')
		}

		return outputText
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {LlamaContext} llamaContext 
	 * @param {LlamaGrammar} llamaGrammar 
	 * @param {string} systemPrompt 
	 * @param {string} userPrompt 
	 */
	static async promptGrammarJsonOne(llamaContext, llamaGrammar, systemPrompt, userPrompt, streamEnabled = false) {
		// console.log(`User : ${CliColor.green(question)}`);
		// console.log(`Ai : computing...`)
			
		// FIXME use LlamaUtils.promptGeneric() instead
		console.error('use LlamaUtils.promptGeneric() instead')


		const llamaSession = new LlamaChatSession({
			context: llamaContext,
			promptWrapper: new LlamaChatPromptWrapper(),
			systemPrompt: systemPrompt,

		});
		const promptOptions = /** @type {import("node-llama-cpp").LLamaChatPromptOptions} */({
			grammar: llamaGrammar,
			maxTokens: llamaContext.getContextSize(),
			/**
			 * 
			 * @param {import("node-llama-cpp").Token[]} chunk 
			 */
			onToken(chunk) {
				if (streamEnabled === false) return
				// display the tokens as they are generated
				process.stdout.write(llamaContext.decode(chunk));
			},
			temperature: 0,
		})
		const response = await llamaSession.promptWithMeta(userPrompt, promptOptions);
		// console.log(`Ai : ${CliColor.cyan(response.text)}`)

		// console.log(`End computing...`)


		const cleanupResponseText = response.text.replace(/”/g, '"')
		let responseJson = null
		try {
			responseJson = Json5.parse(cleanupResponseText)
		} catch (error) {
			console.log(`cleanupResponseText: ${cleanupResponseText}`)
			debugger
			throw error
		}
		// console.log(`responseJson: ${JSON.stringify(responseJson, null, 2)}`)
		return responseJson
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {string} modelPath 
	 * @param {boolean} verbose
	 */
	static async initModelAndContext(modelPath, verbose = false) {
		// debugger
		const hrTimeBefore = process.hrtime();
		const llamaModel = new LlamaModel({
			modelPath,
		});
		const llamaContext = new LlamaContext({
			model: llamaModel
		});
		const hrTimeElapsed = process.hrtime(hrTimeBefore);
		const timeElapsed = hrTimeElapsed[0] + hrTimeElapsed[1] / 1000000000;

		if (verbose) {
			console.log(`modelPath: ${CliColor.red(Path.basename(modelPath))} loaded in ${CliColor.red(timeElapsed.toFixed(2))}-seconds`);
			console.log(`Context size: ${CliColor.red(llamaContext.getContextSize())}-bytes`)
			console.log(`model system info: ${CliColor.red(LlamaModel.systemInfo)}`)
		}

		return { llamaModel, llamaContext }
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {LlamaContext} llamaContext 
	 */
	static async warmUpContext(llamaContext) {
		const llamaSession = new LlamaChatSession({ context: llamaContext });

		// const response = await model.call(question);
		const question = 'hi'
		const response = await llamaSession.promptWithMeta(question);
		// response purposely ignored
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {LlamaContext} llamaContext 
	 * @param {string} question
	 * @param {number} nIterations
	 */
	static async bench(llamaContext, question = 'where do llamas comes from ?', nIterations = 3) {
		const benchResponse = {
			timeElapsed: 0,
			tokensCount: 0,
			charsCount: 0,
		}

		// ensure model is warmed up
		await LlamaUtils.warmUpContext(llamaContext);

		for (let i = 0; i < nIterations; i++) {

			// const promptWrapper = new LlamaChatPromptWrapper();
			const llamaSession = new LlamaChatSession({
				context: llamaContext,
			});

			const hrTimeBefore = process.hrtime();

			const response = await llamaSession.promptWithMeta(question);

			const hrTimeElapsed = process.hrtime(hrTimeBefore);
			const timeElapsed = hrTimeElapsed[0] + hrTimeElapsed[1] / 1000000000;

			// update bench response
			benchResponse.timeElapsed += timeElapsed;
			benchResponse.tokensCount += llamaContext.encode(response.text).length;
			benchResponse.charsCount += response.text.length;
		}

		return benchResponse
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Usage example
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync() {
	{
		const originalText = `{"a": "b"}`
		const cleanedText = LlamaUtils.jsonCleanup(originalText)
		console.log(`originalText: ${originalText}`)
		console.log(`cleanedText: ${cleanedText}`)
	}
	{
		const originalText = `{a: "b"}`
		const cleanedText = LlamaUtils.jsonCleanup(originalText)
		console.log(`originalText: ${originalText}`)
		console.log(`cleanedText: ${cleanedText}`)
	}
	{
		const originalText = `Wow json is great
		
\`\`\`json
{a: "b"}
\`\`\`

This is a JSON object

\`\`\`
{a: "c"}
\`\`\`
`
		const cleanedText = LlamaUtils.jsonCleanup(originalText)
		console.log(`originalText: ${originalText}`)
		console.log(`cleanedText: ${cleanedText}`)
	}
}

// run mainAsync() if this file is run directly from node.js
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) await mainAsync()