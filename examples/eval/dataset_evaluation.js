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

const contextText = await Utils.loadText()
const datasetJson = await Utils.loadDatasetJson(Path.join(__dirname, './data/data.dataset.json'))
const predictionJson = await Utils.loadPredictionJson(Path.join(__dirname, './data/data.prediction.json'))
// sanity check
console.assert(datasetJson.length === predictionJson.length, `datasetJson.length (${datasetJson.length}) !== predictionJson.length (${predictionJson.length})`)
// debugger

const lgModel = new OpenAI({
	// modelName: "gpt-3.5-turbo",
	modelName: 'gpt-4',
	temperature: 0,
	// verbose: true,
});

const evaluator = await loadEvaluator("labeled_criteria", {
	llm: lgModel,
	criteria: "correctness",
});

for (const datasetItem of datasetJson) {
	const indexItem = datasetJson.indexOf(datasetItem)
	const predictionItem = predictionJson[indexItem]
	// debugger
	const input = `${contextText}

Based on this context, answer the following question:
${datasetItem.question}`
	const evalResult = await evaluator.evaluateStrings({
		input: input,
		prediction: predictionItem.answer,
		reference: datasetItem.trueAnswer
	});
	console.log(`Result ${indexItem + 1}th ${JSON.stringify(evalResult, null, '\t')}`);
}

/*
  {
    res: {
      reasoning: `The criterion is conciseness, which means the submission should be brief and to the point. Looking at the submission, the answer to the question "What's 2+2?" is indeed "four". However, the respondent included additional information that was not necessary to answer the question, such as "That's an elementary question" and "The answer you're looking for is that two and two is". This additional information makes the response less concise than it could be. Therefore, the submission does not meet the criterion of conciseness.N`,
      value: 'N',
      score: '0'
    }
  }
*/