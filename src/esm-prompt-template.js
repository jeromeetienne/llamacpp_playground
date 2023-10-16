/**
 * prompt templating for AI in 20 lines of code
 * 
 * - directly taken from MDN - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#tagged_templates
 * - very useful for generating LLMs prompts
 * 
 * @param {TemplateStringsArray} strings 
 * @param  {...any} keys 
 * @returns 
 */
function EsmPromptTemplate(strings, ...keys) {
	/**
	 * @param {...any} values
	 */
	return (...values) => {
		const dict = values[values.length - 1] || {};
		const result = [strings[0]];
		keys.forEach((key, i) => {
			const value = Number.isInteger(key) ? values[key] : dict[key];
			result.push(value, strings[i + 1]);
		});
		return result.join("");
	};
}


export default EsmPromptTemplate

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Usage example
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync(){
	const promptTemplate = EsmPromptTemplate`Here is a context between CONTEXT_BEGIN and CONTEXT_END:
CONTEXT_BEGIN
${"contextText"}
CONTEXT_END

Based on this context, answer the following question:
${"question"}`

	const renderedTemplate = promptTemplate({
		contextText: "my name is john.",
		question: 'What is your name?'
	})

	console.log(renderedTemplate)
}

import { fileURLToPath } from 'url';
const runAsMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (runAsMainModule) {
	// call mainAsync()
	await mainAsync()
}