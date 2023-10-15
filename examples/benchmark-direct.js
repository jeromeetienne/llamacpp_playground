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

/**
 * 
 * @param {string} modelPath 
 */
async function benchOne(modelPath) {
        const modelName = Path.basename(modelPath)

        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	init
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////

        const { llamaContext } = await LlamaUtils.initModelAndContext(modelPath)

        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////


        console.log(`Benching model... ${modelName}`)
        const benchResponse = await LlamaUtils.bench(llamaContext, 'hi', 1);
        // console.log(`benchResponse: ${JSON.stringify(benchResponse)}`)

        console.log(`Time elapsed: ${benchResponse.timeElapsed.toFixed(2)}-seconds`)
        console.log(`Speed: ${(benchResponse.charsCount / benchResponse.timeElapsed).toFixed(2)} chars/second - ${(benchResponse.tokensCount / benchResponse.timeElapsed).toFixed(2)} tokens/second`)
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

let modelKeys = Object.keys(AvailableModelPaths)
// keep only the keys that contains _7B_
modelKeys = modelKeys.filter(modelKey => modelKey.includes('_7B_'))
for(const modelKey of modelKeys) {
        const modelPath = Path.join(__dirname, '../models', AvailableModelPaths[modelKey])
        await benchOne(modelPath)
}
// debugger
// // const modelPath = Path.join(__dirname, '../models', AvailableModelPaths.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
// const modelPath = Path.join(__dirname, '../models', AvailableModelPaths.CODELLAMA_13B_INSTRUCT_Q3_K_M)
// await benchOne(modelPath)