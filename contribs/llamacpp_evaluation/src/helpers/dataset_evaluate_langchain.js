// node imports
import Path from "path";

// langchain imports
import { loadEvaluator } from "langchain/evaluation";
import { OpenAI } from "langchain/llms/openai";

// local imports
import Utils from "../../src/utils.js";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {Object} DatasetEvaluateLangchainOptions
 * @property {Boolean} verbose
 */

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default class DatasetEvaluateLangchain {

	/**
	 * @param {string} evaluationName
	 * @param {string} predictionName
	 * @param {string} modelName
	 * @param {Partial<DatasetEvaluateLangchainOptions>} partialOptions
	 */
	static async evaluate(evaluationName, predictionName, modelName = 'gpt-4', partialOptions = {}) {

		// handle default options
		partialOptions = Object.assign({}, /** @type {DatasetEvaluateLangchainOptions} */({
			verbose: false,
		}), partialOptions)
		const options = /** @type {DatasetEvaluateLangchainOptions} */(partialOptions)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		// async function doDatasetEvaluateLangchain() {
		// const evaluationName = 'myeval'

		const contextText = await Utils.loadContextText()
		const datasetJson = await Utils.loadEvaluationDatasetJson(evaluationName)
		const predictionJson = await Utils.loadPredictionJson(evaluationName, predictionName)
		// sanity check
		console.assert(datasetJson.length === predictionJson.length, `datasetJson.length (${datasetJson.length}) !== predictionJson.length (${predictionJson.length})`)
		// debugger

		const lgModel = new OpenAI({
			// modelName: "gpt-3.5-turbo",
			modelName: modelName,
			temperature: 0,
			// verbose: true,
		});

		const evaluator = await loadEvaluator("labeled_criteria", {
			// llm: lgModel,
			criteria: "correctness",
		});


		const evaluationJson = /** @type {import("../../src/type.d.js").EvaluationJson} */([])
		for (const datasetItem of datasetJson) {
			const indexItem = datasetJson.indexOf(datasetItem)
			const predictionItem = predictionJson[indexItem]
			// debugger
			const input = `${contextText}

Based on this context, answer the following question:
${datasetItem.userInput}`

			// debugger
			const evaluatorArgs = /** @type {import("langchain/dist/evaluation/base.js").StringEvaluatorArgs} */({
				input: input,
				prediction: predictionItem.predictedResponse,
				reference: datasetItem.expectedResponse
			})
			console.log({ evaluatorArgs })

			// langchain doc - https://js.langchain.com/docs/guides/evaluation/string/criteria
			const evalResult = await evaluator.evaluateStrings(evaluatorArgs);
			// debugger
			/*
			{
				reasoning: `The criterion is conciseness, which means the submission should be brief and to the point. Looking at the submission, the answer to the question "What's 2+2?" is indeed "four". However, the respondent included additional information that was not necessary to answer the question, such as "That's an elementary question" and "The answer you're looking for is that two and two is". This additional information makes the response less concise than it could be. Therefore, the submission does not meet the criterion of conciseness.N`,
				value: 'N',
				score: '0'
			}
			*/
			console.log(`Result ${indexItem + 1}th ${JSON.stringify(evalResult, null, '\t')}`);

			const evaluationItemJson = /** @type {import("../../src/type.d.js").EvaluationItemJson} */({
				predictionValid: evalResult.value === 'Y' ? true : false
			})
			evaluationJson.push(evaluationItemJson)
		}

		if (options.verbose) {
			console.log(`OUTPUT`)
			console.log(`${JSON.stringify(evaluationJson, null, '\t')}`)
		}

		return evaluationJson
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Usage example
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync() {
	const evaluationName = 'myeval'
	const predictionName = 'basic'
	const modelName = 'gpt-3.5-turbo'
	await DatasetEvaluateLangchain.evaluate(evaluationName, predictionName, modelName, {
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