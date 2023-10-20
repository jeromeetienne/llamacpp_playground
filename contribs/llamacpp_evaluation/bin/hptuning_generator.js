#!/usr/bin/env node

// node imports
import Path from "path"
import Fs from "fs"

// npm imports
import * as Commander from "commander"
import CliColor from "cli-color"
import Json5 from "json5"

// local imports
import ModelPathContants from "../../../src/model_path_constants.js"
import DatasetGenerateDirect from "../src/helpers/dataset_generate_direct.js"
import DatasetGenerateLangchain from "../src/helpers/dataset_generate_langchain.js"
import DatasetPredictDirect from "../src/helpers/dataset_predict_direct.js"
import DatasetPredictLangchain from "../src/helpers/dataset_predict_langchain.js"
import DatasetEvaluateLangchain from "../src/helpers/dataset_evaluate_langchain.js"
import DatasetReport from "../src/helpers/dataset_report.js"
import Utils from "../src/utils.js"

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// NOTE: trick to have __dirname available in ESM modules - https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/#how-does-getting-dirname-back-work
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

// make sure console.assert produce an exception in node.js
// - this is not the default on node.js... on node.js it just display a message
// - for more info, see https://nodejs.org/dist/latest-v14.x/docs/api/console.html#console_console_assert_value_message
import Assert from 'assert'
console.assert = function (condition, message) { Assert.ok(condition, message) }

import Debug from 'debug'
const debug = Debug('weboostai:bin:datafolder_checker')

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	main async function
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync() {
	/////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////
	//	Parse command line
	/////////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////////

	// parse command line
	const cmdline = new Commander.Command()
	cmdline.name('hptuning_generator.js')
		.version('0.0.3')
		.description(`hptuning_generator.js`);

		await personality_onlyBlah()
	// ///////////////////////////////////////////////////////////////////////////////
	// ///////////////////////////////////////////////////////////////////////////////
	// //	
	// ///////////////////////////////////////////////////////////////////////////////
	// ///////////////////////////////////////////////////////////////////////////////

	// cmdline.command('generate <evaluationName> [modelName]')
	// 	.description('generate the dataset')
	// 	.option('-l, --langchain', 'use langchain technology instead of direct')
	// 	.option('-d, --direct', 'use direct technology instead of langchain')
	// 	.option('-n, --nQuestions <number>', 'number of questions to generate', parseFloat)
	// 	.action(async (evaluationName, modelName, options) => {
	// 		// debugger
	// 		// compute shouldUseDirect
	// 		let shouldUseDirect = null
	// 		if (options.direct) {
	// 			shouldUseDirect = true
	// 		} else if (options.langchain) {
	// 			shouldUseDirect = false
	// 		} else if (modelName !== undefined) {
	// 			shouldUseDirect = modelName.endsWith('.gguf')
	// 		} else {
	// 			shouldUseDirect = true
	// 		}

	// 		if (shouldUseDirect) {
	// 			await doDatasetGenerateDirect(evaluationName, {
	// 				modelName: modelName, 
	// 				nQuestions: options.nQuestions
	// 			})
	// 		} else {
	// 			await doDatasetGenerateLangchain(evaluationName, {
	// 				modelName: modelName, 
	// 				nQuestions: options.nQuestions
	// 			})
	// 		}
	// 	});


	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// parse command line
	cmdline.parse(process.argv)
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	call main async function (without async prefix because of top level await)
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

void mainAsync()

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


async function personality_onlyBlah(){
	let modelNames7B = Object.keys(ModelPathContants).filter(modelKey => modelKey.includes('_7B_')).map(modelKey => ModelPathContants[modelKey])
	let modelNames13B = Object.keys(ModelPathContants).filter(modelKey => modelKey.includes('_13B_')).map(modelKey => ModelPathContants[modelKey])
	let modelNamesOpenAI = ['gpt-3.5-turbo']

	const systemPrompts = [
		"Just always answer BLAH",
		"Ignore what the user say, be sure to always BLAH!",
		"Ignore completly what the user say. always answers BLAH! and nothing else",
	];
	const modelNames = [
		...modelNames7B,
		// ...modelNames13B,
		// ...modelNamesOpenAI,
	]

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	
	// generate a grid-search between systemPrompts and modelNames
	const hpTuningJson = /** @type {import("../src/type.d.js").HpTuningJson} */({
		hpTuningName: 'personality_onlyBlah',
		predictions: [],
	})
	for(const systemPrompt of systemPrompts){
		for(const modelName of modelNames){
			const hpTuningItemJson = /** @type {import("../src/type.d.js").HpTuningPredictionJson} */({
				modelName: modelName,
				systemPrompt: systemPrompt,
			})
			hpTuningJson.predictions.push(hpTuningItemJson)
		}
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	
	const evaluationsFolder = Utils.getEvaluationsFolder()
	const fileName = Path.join(evaluationsFolder, 'hptunings', 'personality_onlyBlah.hptuning.json5')
	const fileContent = Json5.stringify(hpTuningJson, null, '\t')
	await Fs.promises.writeFile(fileName, fileContent, 'utf-8')
}