/**
 * - from https://js.langchain.com/docs/modules/model_io/models/llms/integrations/llama_cpp
 */

// node imports
import Path from "path";

// local imports
import LlamaUtils from "../src/llama-utils.js";
import ModelPathContants from "../src/model_path_constants.js";

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
        const benchResponse = await LlamaUtils.bench(llamaContext);
        // console.log(`benchResponse: ${JSON.stringify(benchResponse)}`)

        console.log(`Time elapsed: ${benchResponse.timeElapsed.toFixed(2)}-seconds`)
        console.log(`Speed: ${(benchResponse.charsCount / benchResponse.timeElapsed).toFixed(2)} chars/second - ${(benchResponse.tokensCount / benchResponse.timeElapsed).toFixed(2)} tokens/second`)
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

let modelKeys = Object.keys(ModelPathContants)
// keep only the keys that contains _7B_
modelKeys = modelKeys.filter(modelKey => modelKey.includes('_7B_'))
for(const modelKey of modelKeys) {
        const modelPath = Path.join(__dirname, '../models', ModelPathContants[modelKey])
        await benchOne(modelPath)
}
// debugger
// // const modelPath = Path.join(__dirname, '../models', ModelPathContants.MISTRAL_7B_INSTRUCT_V0_1_Q6_K)
// const modelPath = Path.join(__dirname, '../models', ModelPathContants.CODELLAMA_13B_INSTRUCT_Q3_K_M)
// await benchOne(modelPath)