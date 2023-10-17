#!/usr/bin/env node

// node imports
import Path from "path"
import Fs from "fs"

// npm imports
import * as Commander from "commander"
import CliColor from "cli-color"
import Json5 from "json5"

// local imports
import AvailableModelPaths from "../src/available_model_paths.js"
import DatasetGenerateDirect from "./dataset_evaluation_helpers/dataset_generate_direct.js"
import DatasetGenerateLangchain from "./dataset_evaluation_helpers/dataset_generate_langchain.js"
import DatasetPredictDirect from "./dataset_evaluation_helpers/dataset_predict_direct.js"
import DatasetPredictLangchain from "./dataset_evaluation_helpers/dataset_predict_langchain.js"
import DatasetEvaluateLangchain from "./dataset_evaluation_helpers/dataset_evaluate_langchain.js"
import DatasetReport from "./dataset_evaluation_helpers/dataset_report.js"
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
	cmdline.name('dataset_evaluation.js')
		.version('0.0.3')
		.description(`dataset_evaluation.js - perform all evaluations on a named dataset

Some functions are available in 2 technologies: langchain and direct.
        
About Model Names: When using langchain, the model name is something like "gpt-4" or "gpt-3.5-turbo".
When using direct node-llama-cpp, the model name is something like "codellama-13b-instruct.Q2_K.gguf" or 
"mistral-7b-instruct-v0.1.Q6_K.gguf". Typically this is the basename of the files stored in "models" folder.
`);

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	cmdline.command('generate <evaluationName> [modelName]')
		.description('generate the dataset')
		.option('-l, --langchain', 'use langchain technology instead of direct')
		.option('-d, --direct', 'use direct technology instead of langchain')
		.option('-n, --nquestions <number>', 'number of questions to generate', parseFloat)
		.action(async (evaluationName, modelName, options) => {
			// debugger
			// compute shouldUseDirect
			let shouldUseDirect = null
			if (options.direct) {
				shouldUseDirect = true
			} else if (options.langchain) {
				shouldUseDirect = false
			} else if (modelName !== undefined) {
				shouldUseDirect = modelName.endsWith('.gguf')
			} else {
				shouldUseDirect = true
			}

			if (shouldUseDirect) {
				await doDatasetGenerateDirect(evaluationName, modelName, options.nquestions)
			} else {
				await doDatasetGenerateLangchain(evaluationName, modelName, options.nquestions)
			}
		});

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	cmdline.command('predict <evaluationName> <predictionName> [modelName]')
		.description('predict on the dataset')
		.option('-l, --langchain', 'use langchain technology instead of direct')
		.option('-d, --direct', 'use direct technology instead of langchain')
		.action(async (evaluationName, predictionName, modelName, options) => {
			// compute shouldUseDirect
			let shouldUseDirect = true
			if (options.direct) {
				shouldUseDirect = true
			} else if (options.langchain) {
				shouldUseDirect = false
			} else if (modelName !== undefined) {
				shouldUseDirect = modelName.endsWith('.gguf')
			} else {
				shouldUseDirect = true
			}

			if (shouldUseDirect) {
				await doDatasetPredictDirect(evaluationName, predictionName, modelName)
			} else {
				await doDatasetPredictLangchain(evaluationName, predictionName, modelName)
			}
		});

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	cmdline.command('evaluate <evaluationName> <predictionName>')
		.description('evaluate the prediction based on the dataset')
		.action(async (evaluationName, predictionName, options) => {
			await doDatasetEvaluateLangchain(evaluationName, predictionName)
		});

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	cmdline.command('report <evaluationName>')
		.description('Print a report on the dataset evaluation')
		.action(async (evaluationName, options) => {
			await doDatasetReport(evaluationName)
		});

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	cmdline.command('hp-tuning <evaluationName> <hpTuningPath>')
		.description('Do hyperparameters tuning for a given .hptuning.json file')
		.action(async (evaluationName, hpTuningPath, options) => {
			await doDatasetHpTuning(evaluationName, hpTuningPath)
		});

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

/**
 * 
 * @param {string} evaluationName 
 * @param {string=} modelName
 * @param {number=} nQuestions
 */
async function doDatasetGenerateDirect(evaluationName, modelName = undefined, nQuestions = undefined) {
	if (modelName) {
		modelName = Path.basename(modelName)
	}
	modelName = modelName ?? AvailableModelPaths.LLAMA_2_7B_CHAT_Q2_K

	const options = /** @type {import("./dataset_evaluation_helpers/dataset_generate_direct.js").DatasetGenerateDirectOptions} */({})
	if (nQuestions !== undefined) options.nQuestions = nQuestions
	const datasetJson = await DatasetGenerateDirect.generate(evaluationName, modelName, options)

	// save a prediction.json file
	await Utils.saveDatasetJson(evaluationName, datasetJson);

	console.log(`Generate OUTPUT by ${CliColor.red(modelName)}`)
	console.log(`${JSON.stringify(datasetJson, null, '\t')}`)
}

/**
 * 
 * @param {string} evaluationName 
 * @param {string=} modelName
 * @param {number=} nQuestions
 */
async function doDatasetGenerateLangchain(evaluationName, modelName = undefined, nQuestions = undefined) {
	modelName = modelName ?? 'gpt-3.5-turbo'
	const datasetJson = await DatasetGenerateLangchain.generate(evaluationName, modelName, {
		// verbose: true,
		nQuestions: nQuestions,
	})

	// save a prediction.json file
	await Utils.saveDatasetJson(evaluationName, datasetJson);

	console.log(`Generate OUTPUT by ${CliColor.red(modelName)}`)
	console.log(`${JSON.stringify(datasetJson, null, '\t')}`)
}

/**
 * 
 * @param {string} evaluationName 
 * @param {string} predictionName
 * @param {string=} modelName
 * @param {string=} prompt
 */
async function doDatasetPredictDirect(evaluationName, predictionName, modelName = undefined, prompt = undefined) {
	// build a metadata.json file
	const metadataJson = /** @type {import("../src/type.d.js").PredictionMetadataJson} */({
		defaultPredictOptions: {
			modelName: DatasetPredictDirect.defaultPredictOptions.modelName,
			prompt: DatasetPredictDirect.defaultPredictOptions.prompt,
		},
		modifiedPredictOptions: {
		}
	})
	if (prompt !== undefined) metadataJson.modifiedPredictOptions.prompt = prompt
	if (modelName !== undefined) metadataJson.modifiedPredictOptions.modelName = modelName
	// save a metadata.json file
	await Utils.savePredictionMetadataJson(evaluationName, predictionName, metadataJson)


	// trick to have modelName be a path up to this point, now we take the basename
	// - this helps the command line writing thanks bash autocompletion and using ./models/ folder
	if (modelName) {
		modelName = Path.basename(modelName)
	}
	// assigned modelName if not defined
	if (modelName === undefined) {
		modelName = DatasetPredictDirect.defaultPredictOptions.modelName
	}

	// do the actual prediction
	const predictionJson = await DatasetPredictDirect.predict(evaluationName, predictionName, {
		modelName: modelName,
		prompt: prompt,
		// verbose: true
	})

	// save a prediction.json file
	await Utils.savePredictionJson(evaluationName, predictionName, predictionJson);


	console.log(`Prediction OUTPUT by ${CliColor.red(modelName)}`)
	console.log(`${JSON.stringify(predictionJson, null, '\t')}`)
}

/**
 * 
 * @param {string} evaluationName 
 * @param {string} predictionName
 * @param {string=} modelName
 * @param {string=} prompt
 */
async function doDatasetPredictLangchain(evaluationName, predictionName, modelName = undefined, prompt = undefined) {
	// build a metadata.json file
	const metadataJson = /** @type {import("../src/type.d.js").PredictionMetadataJson} */({
		defaultPredictOptions: {
			modelName: DatasetPredictLangchain.defaultPredictOptions.modelName,
			prompt: DatasetPredictLangchain.defaultPredictOptions.prompt,
		},
		modifiedPredictOptions: {
		}
	})
	if (prompt !== undefined) metadataJson.modifiedPredictOptions.prompt = prompt
	if (modelName !== undefined) metadataJson.modifiedPredictOptions.modelName = modelName
	// save a metadata.json file
	await Utils.savePredictionMetadataJson(evaluationName, predictionName, metadataJson)

	// assigned modelName if not defined
	modelName = modelName ?? 'gpt-3.5-turbo'

	// do the actual prediction
	const predictionJson = await DatasetPredictLangchain.predict(evaluationName, predictionName, {
		modelName: modelName,
		prompt: prompt,
		// verbose: true
	})

	// save a prediction.json file
	await Utils.savePredictionJson(evaluationName, predictionName, predictionJson);


	console.log(`Prediction OUTPUT by ${CliColor.red(modelName)}`)
	console.log(`${JSON.stringify(predictionJson, null, '\t')}`)
}

/**
 * 
 * @param {string} evaluationName 
 * @param {string} predictionName
 */
async function doDatasetEvaluateLangchain(evaluationName, predictionName) {
	const modelName = 'gpt-3.5-turbo'
	const evaluationJson = await DatasetEvaluateLangchain.evaluate(evaluationName, predictionName, modelName, {
		// verbose: true
	})

	await Utils.saveEvaluationJson(evaluationName, predictionName, evaluationJson)

	console.log(`Evaluate OUTPUT by ${CliColor.red(modelName)}`)
	console.log(`${JSON.stringify(evaluationJson, null, '\t')}`)
}

/**
 * 
 * @param {string} evaluationName 
 */
async function doDatasetReport(evaluationName) {
	await DatasetReport.display(evaluationName, {
		// verbose: true
	})
}


/**
 * 
 * @param {string} evaluationName 
 * @param {string} hpTuningPath 
 */
async function doDatasetHpTuning(evaluationName, hpTuningPath) {

	const fileContent = await Fs.promises.readFile(hpTuningPath, 'utf8')
	const hpTuningJson = /** @type {import("../src/type.d.js").HpTuningJson} */(Json5.parse(fileContent))
	// debugger

	for (const searchPrediction of hpTuningJson.predictions) {
		const itemIndex = hpTuningJson.predictions.indexOf(searchPrediction)
		const predictionName = `hp_${hpTuningJson.hpTuningName}_${itemIndex}`
		const shouldUseDirect = searchPrediction.modelName?.endsWith('.gguf') || searchPrediction.modelName === undefined
		if (shouldUseDirect) {
			await doDatasetPredictDirect(evaluationName, predictionName, searchPrediction.modelName, searchPrediction.prompt)
		} else {
			// debugger
			await doDatasetPredictLangchain(evaluationName, predictionName, searchPrediction.modelName, searchPrediction.prompt)
		}

		await doDatasetEvaluateLangchain(evaluationName, predictionName)
	}
}