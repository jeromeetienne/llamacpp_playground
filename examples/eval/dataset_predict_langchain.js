// node imports
import Path from "path";
import Fs from 'fs'

// npm imports
import Json5 from "json5";
import CliColor from "cli-color";

// langchain imports
import { PromptTemplate } from "langchain/prompts";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAI } from "langchain/llms/openai";
import { LlamaCpp } from "langchain/llms/llama_cpp";
import { LLMChain } from "langchain/chains";

// local imports
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

const lgModel = new OpenAI({ 
	// modelName: "gpt-3.5-turbo",
	temperature: 0 
});
const modelName = lgModel.modelName

// const modelPath = Path.join(__dirname, '../../models', AvailableModelPaths.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
// const modelName = Path.basename(modelPath)
// const lgModel = new LlamaCpp({ modelPath });

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// debugger
const promptTemplate = PromptTemplate.fromTemplate(
	`Here is a context between CONTEXT_BEGIN and CONTEXT_END:
CONTEXT_BEGIN
{contextText}
CONTEXT_END

Based on this context, answer the following question:
{question}`
);




const contextText = await Utils.loadText()

const datasetPath = Path.join(__dirname, './data', 'data.dataset.json')
const datasetFileContent = await Fs.promises.readFile(datasetPath, 'utf-8')
const datasetArray = /** @type {import("./type.d.js").DatasetArrayJson} */(Json5.parse(datasetFileContent))


const predictionArrayJson = /** @type {import("./type.d.js").PredictionArrayJson} */([])

// const chain = promptTemplate.pipe(lgModel);
const chain = new LLMChain({ llm: lgModel, prompt: promptTemplate });


for (const datasetItem of datasetArray) {
	console.log(`Question : ${CliColor.green(datasetItem.question)}`);
	const result = await chain.call({
		contextText: contextText,
		question: datasetItem.question,
	});
	// debugger
	// @ts-ignore
	let outputText = /** @type {string} */(null)
	if( result.content ){
		outputText = result.content.trim()
	}else if(result.text){
		outputText = result.text.trim()
	}else{
		// @ts-ignore
		outputText = /** @type {string} */(result)
		outputText = outputText.trim()
	}


	console.log(`Answer : ${CliColor.cyan(outputText)}`)
	const predictionItemJson = /** @type {import("./type.d.js").PredictionItemJson} */({ answer: outputText })
	predictionArrayJson.push(predictionItemJson)
}

console.log(`OUTPUT by ${CliColor.red(modelName)}`)
console.log(`${JSON.stringify(predictionArrayJson, null, '\t')}`)
