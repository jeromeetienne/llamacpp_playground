export default class FstringTemplate {
        /**
         * 
         * @param {string} templateText 
         */
        constructor(templateText) {
                this._templateText = templateText
        }

        /**
         * 
         * @param {Object<String, any>} parameters 
         */
        generate(parameters) {
                const renderedTemplate = FstringTemplate.render(this._templateText, parameters)
                return renderedTemplate
        }

        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	static methods
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        
        /**
         * 
         * @param {string} templateText 
         * @param {Object<String, any>} parameters 
         * @returns 
         */
        static render(templateText, parameters) {
                const renderedTemplate = templateText.replace(/{([^{}]+)}/g, function (_, parameterName) {
                        if (parameters[parameterName] === undefined) {
                                return ''
                        }
                        return parameters[parameterName]
                })
                return renderedTemplate
        }
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Usage example
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync() {
        const templateText = `Here is a context between CONTEXT_BEGIN and CONTEXT_END:
CONTEXT_BEGIN
{context}
CONTEXT_END

Based on this context, answer the following question:
{question}`
        const fstringTemplate = new FstringTemplate(templateText)
        const renderedTemplate = fstringTemplate.generate({
                context: "my name is john.",
                question: 'What is your name?'
        })
        console.log({ renderedTemplate })
}

// run mainAsync() if this file is run directly from node.js
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
        await mainAsync()
}