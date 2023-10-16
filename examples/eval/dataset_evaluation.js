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

const evaluationName = 'myeval'

const contextText = await Utils.loadText()
const datasetJson = await Utils.loadDatasetJson(evaluationName)
const predictionJson = await Utils.loadPredictionJson(evaluationName)
// sanity check
console.assert(datasetJson.length === predictionJson.length, `datasetJson.length (${datasetJson.length}) !== predictionJson.length (${predictionJson.length})`)
// debugger

// const lgModel = new OpenAI({
// 	// modelName: "gpt-3.5-turbo",
// 	modelName: 'gpt-4',
// 	temperature: 0,
// 	// verbose: true,
// });

const evaluator = await loadEvaluator("labeled_criteria", {
	// llm: lgModel,
	criteria: "correctness",
});


const evaluationArrayJson = /** @type {import("./type.d.js").EvaluationArrayJson} */([])
for (const datasetItem of datasetJson) {
	const indexItem = datasetJson.indexOf(datasetItem)
	const predictionItem = predictionJson[indexItem]
	// debugger
	const input = `${contextText}

Based on this context, answer the following question:
${datasetItem.question}`

	const evaluatorArgs = /** @type {import("langchain/dist/evaluation/base.js").StringEvaluatorArgs} */({
		input: input,
		prediction: predictionItem.predictedAnswer,
		reference: datasetItem.trueAnswer
	})
	console.log({evaluatorArgs})

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

	const evaluationItemJson = /** @type {import("./type.d.js").EvaluationItemJson} */({
		predictionValid: evalResult.value === 'Y' ? true : false
	})
	evaluationArrayJson.push(evaluationItemJson)
}


console.log(`OUTPUT`)
console.log(`${JSON.stringify(evaluationArrayJson, null, '\t')}`)

