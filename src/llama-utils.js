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
         * @param {string} question 
         */
        static async promptGrammarJsonOne(llamaContext, llamaGrammar, systemPrompt, question) {
                // console.log(`User : ${CliColor.green(question)}`);
                // console.log(`Ai : computing...`)

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
                                // display the tokens as they are generated
                                process.stdout.write(llamaContext.decode(chunk));
                        },
                        temperature: 1,
                })
                const response = await llamaSession.promptWithMeta(question, promptOptions);
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

        /**
         * 
         * @param {string} modelPath 
         */
        static async loadModelContext(modelPath) {
                // debugger
                const hrTimeBefore = process.hrtime();
                const llamaModel = new LlamaModel({
                        modelPath,
                });
                const llamaContext = new LlamaContext({ model: llamaModel });
                const hrTimeElapsed = process.hrtime(hrTimeBefore);
                const timeElapsed = hrTimeElapsed[0] + hrTimeElapsed[1] / 1000000000;

                console.log(`modelPath: ${CliColor.red(Path.basename(modelPath))} loaded in ${CliColor.red(timeElapsed.toFixed(2))}-seconds`);
                console.log(`Context size: ${CliColor.red(llamaContext.getContextSize())}-bytes`)
                console.log(`model system info: ${CliColor.red(LlamaModel.systemInfo)}`)

                return { llamaModel, llamaContext }
        }

        static async loadText(contextLineLimit = 10) {
                const contextFileName = Path.join(__dirname, '../data/state_of_the_union.txt')
                const contextTextFull = await Fs.promises.readFile(contextFileName, 'utf8')
                const contextTextLines = contextTextFull.split('\n').map(line => line.trim()).filter(line => line.length > 0)
                // keep only the 200 first lines
                contextTextLines.splice(contextLineLimit)
                const contextText = contextTextLines.join('\n')
                return contextText
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
        static async bench(llamaContext, question = 'Where do Llamas come from?', nIterations = 3) {
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