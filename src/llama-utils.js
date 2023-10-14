// npm imports
import { LlamaModel, LlamaContext, LlamaChatSession, LlamaGrammar, LlamaJsonSchemaGrammar, LlamaChatPromptWrapper } from "node-llama-cpp";


export default class LlamaUtils {

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