// node imports
import Path from "path";
import Fs from 'fs'

// npm imports
import Json5 from "json5";
import CliColor from "cli-color";

// langchain imports
import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";

// local imports
import Utils from "../../src/utils.js";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));

const lgModel = new ChatOpenAI({});
// debugger
const promptTemplate = PromptTemplate.fromTemplate(
	`Here is a context between CONTEXT_BEGIN and CONTEXT_END:
CONTEXT_BEGIN
{contextText}
CONTEXT_END

Based on this context, answer the following question:
{question}`
);


/*
  AIMessage {
    content: "Why don't bears wear shoes?\n\nBecause they have bear feet!",
  }
*/


const contextText = await Utils.loadText()

const datasetPath = Path.join(__dirname, './data', 'data.dataset.json')
const datasetFileContent = await Fs.promises.readFile(datasetPath, 'utf-8')
const datasetArray = /** @type {import("./type.d.js").DatasetArrayJson} */(Json5.parse(datasetFileContent))


const predictionArrayJson = /** @type {import("./type.d.js").PredictionArrayJson} */([])

const chain = promptTemplate.pipe(lgModel);



for (const datasetItem of datasetArray) {
	console.log(`Question : ${CliColor.green(datasetItem.question)}`);
	const result = await chain.invoke({ 
		contextText: contextText, 
		question: datasetItem.question 
	});
	const outputText = result.content;	
	

	console.log(`Answer : ${CliColor.cyan(outputText)}`)
	const predictionItemJson = /** @type {import("./type.d.js").PredictionItemJson} */({ answer: outputText })
	predictionArrayJson.push(predictionItemJson)
}

console.log(`OUTPUT ${CliColor.red(lgModel.modelName)}`)
console.log(`${JSON.stringify(predictionArrayJson, null, '\t')}`)
