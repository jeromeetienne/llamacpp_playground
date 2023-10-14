/**
 * - from https://js.langchain.com/docs/modules/model_io/models/llms/integrations/llama_cpp
 */

// node imports
import Path from "path";
import JSON5 from 'json5'

// npm imports
import { LlamaModel, LlamaContext, LlamaChatSession, LlamaGrammar, LlamaJsonSchemaGrammar, LlamaChatPromptWrapper } from "node-llama-cpp";
import CliColor from "cli-color";
import Zod from "zod";
import * as JsonSchemaToZod from "json-schema-to-zod"
import { zodToJsonSchema } from "zod-to-json-schema";


// local imports
import LlamaUtils from "../src/llama-utils.js";
import AvailableModelPaths from "../src/available_model_paths.js";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));


const modelPath = Path.join(__dirname, '../models', AvailableModelPaths.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
// const modelPath = Path.join(__dirname, '../models', AvailableModelPaths.CODELLAMA_7B_INSTRUCT_Q4_K_M)

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

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// const mySchema = Zod
//   .object({
//     myString: Zod.string().min(5),
//     myUnion: Zod.union([Zod.number(), Zod.boolean()]),
//   })
//   .describe("My neat object schema");

const responseZodSchema = Zod.array(Zod.object({
        question: Zod.string(),
        answer: Zod.string(),
}))

const responseJsonSchemaFull = zodToJsonSchema(responseZodSchema, "responseJsonSchema");
const responseJsonSchema = /** @type {Object} */(responseJsonSchemaFull.definitions?.['responseJsonSchema'])

console.log(JSON.stringify(responseJsonSchema, null, 2))

const contextText = `My name is john, i like blue and eat sausages.`
// const llamaGrammar = await LlamaGrammar.getFor("json");
const llamaGrammar = new LlamaJsonSchemaGrammar(responseJsonSchema)

const systemPrompt = `Be sure to Format your response in JSON as an array of strings`;

const promptOptions = /** @type {import("node-llama-cpp").LLamaChatPromptOptions} */({
	grammar: llamaGrammar,
	maxTokens: llamaContext.getContextSize(),
        /**
         * 
         * @param {import("node-llama-cpp").Token[]} chunk 
         */
        onToken(chunk) {
                process.stdout.write(llamaContext.decode(chunk));
            },
	temperature: 1,
})

const question = `Here is a context:
${contextText}

Please generate 1 questions about this context?`;

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

const responseJson = JSON5.parse(response.text)
console.log(`responseJson: ${JSON.stringify(responseJson, null, 2)}`)