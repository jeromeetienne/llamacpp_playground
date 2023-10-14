/**
 * - from https://js.langchain.com/docs/modules/model_io/models/llms/integrations/llama_cpp
 */

// node imports
import Path from "path";

// npm imports
import { LlamaModel, LlamaContext, LlamaChatSession, LlamaGrammar, LlamaJsonSchemaGrammar, LlamaChatPromptWrapper } from "node-llama-cpp";
import CliColor from "cli-color";

// local imports
import LlamaUtils from "../src/llama-utils.js";
import AvailableModelPaths from "../src/available_model_paths.js";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));


// const modelPath = Path.join(__dirname, '../models', AvailableModelPaths.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
const modelPath = Path.join(__dirname, '../models', AvailableModelPaths.CODELLAMA_13B_INSTRUCT_Q3_K_M)

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	init
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// debugger
const loadModelHrTimeBefore = process.hrtime();
const llamaModel = new LlamaModel({
	modelPath,
});
const llamaContext = new LlamaContext({ model: llamaModel });
const loadModelHrTimeElapsed = process.hrtime(loadModelHrTimeBefore);
const loadModelTimeElapsed = loadModelHrTimeElapsed[0] + loadModelHrTimeElapsed[1] / 1000000000;

console.log(`modelPath: ${CliColor.red(Path.basename(modelPath))} loaded in ${CliColor.red(loadModelTimeElapsed.toFixed(2))}-seconds`);
console.log(`Context size: ${CliColor.red(llamaContext.getContextSize())}-bytes`)
console.log(`model system info: ${CliColor.red(LlamaModel.systemInfo)}`)

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const shoudBeWarmUp = false;
if (shoudBeWarmUp) {
	console.log(CliColor.cyan(`Warming up model...`))
	await LlamaUtils.warmUpContext(llamaContext);
	console.log(`model warmed up`)
}

const shoudBeBenched = false;
if (shoudBeBenched) {
	console.log('Benching model...')
	const benchResponse = await LlamaUtils.bench(llamaContext);
	// console.log(`benchResponse: ${JSON.stringify(benchResponse)}`)

	console.log(`Time elapsed: ${benchResponse.timeElapsed.toFixed(2)}-seconds`)
	console.log(`Speed: ${(benchResponse.charsCount/benchResponse.timeElapsed).toFixed(2)} chars/second - ${(benchResponse.tokensCount/benchResponse.timeElapsed).toFixed(2)} tokens/second`)

	process.exit(0);
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const llamaGrammar = await LlamaGrammar.getFor("json");
const systemPrompt = `Format your answer in JSON with the properties "response" and "question"`;
const promptOptions = /** @type {import("node-llama-cpp").LLamaChatPromptOptions} */({
	grammar: llamaGrammar,
	maxTokens: llamaContext.getContextSize(),

	// temperature: 0.0,
})

const question = `Where do Llamas come from?`;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

console.log(`User : ${CliColor.green(question)}`);
console.log(`Ai : computing...`)

const llamaSession = new LlamaChatSession({
	context: llamaContext,
	promptWrapper: new LlamaChatPromptWrapper(),
	systemPrompt: systemPrompt,
});

const response = await llamaSession.promptWithMeta(question, promptOptions);
console.log(`Ai : ${CliColor.cyan(response.text)}`)

console.log(`End computing...`)
