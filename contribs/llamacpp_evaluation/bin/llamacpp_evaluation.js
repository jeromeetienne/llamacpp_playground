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
		.option('-n, --nQuestions <number>', 'number of questions to generate', parseFloat)
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
				await doDatasetGenerateDirect(evaluationName, {
					modelName: modelName,
					nQuestions: options.nQuestions
				})
			} else {
				await doDatasetGenerateLangchain(evaluationName, {
					modelName: modelName,
					nQuestions: options.nQuestions
				})
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
				await doDatasetPredictDirect(evaluationName, predictionName, { modelName })
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

	cmdline.command('hptuning <evaluationName> <hpTuningPath>')
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
 * @param {object} options
 * @param {string=} options.modelName
 * @param {number=} options.nQuestions
 */
async function doDatasetGenerateDirect(evaluationName, options = {}) {

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	do the generate itself
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	// debugger
	const datasetJson = await DatasetGenerateDirect.generate({
		modelName: options.modelName,
		nQuestions: options.nQuestions,
		verbose: true
	})

	// save a prediction.json file
	await Utils.saveDatasetJson(evaluationName, datasetJson);

	const modelName = options.modelName ?? DatasetGenerateDirect.defaultGenerateOptions.modelName
	console.log(`Generate OUTPUT by ${CliColor.red(modelName)}`)
	console.log(`${JSON.stringify(datasetJson, null, '\t')}`)
}

/**
 * 
 * @param {string} evaluationName 
 * @param {object}	options
 * @param {string=} options.modelName
 * @param {number=} options.nQuestions
 */
async function doDatasetGenerateLangchain(evaluationName, options = {}) {
	const datasetJson = await DatasetGenerateLangchain.generate({
		modelName: options.modelName,
		nQuestions: options.nQuestions,
		verbose: true,
	})

	// save a prediction.json file
	await Utils.saveDatasetJson(evaluationName, datasetJson);

	const modelName = options.modelName ?? DatasetGenerateLangchain.defaultGenerateOptions.modelName
	console.log(`Generate OUTPUT by ${CliColor.red(modelName)}`)
	console.log(`${JSON.stringify(datasetJson, null, '\t')}`)
}

/**
 * 
 * @param {string} evaluationName 
 * @param {string} predictionName
 * @param {object} options
 * @param {string=} options.modelName
 * @param {string=} options.systemPrompt
 * @param {string=} options.userPrompt
 */
async function doDatasetPredictDirect(evaluationName, predictionName, options = {}) {

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	if it already exists, skip
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	if (await Utils.hasPredictionMetadataJson(evaluationName, predictionName) && await Utils.hasPredictionJson(evaluationName, predictionName)) {
		console.log(`Predict for ${evaluationName}/${predictionName} already exists, skipping...`)
		return
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Build and save .prediction-metadata.json file
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// build a metadata.json file
	const predictionMetadataJson = /** @type {import("../src/type.d.js").PredictionMetadataJson} */({
		defaultOptions: {
			modelName: DatasetPredictDirect.defaultPredictOptions.modelName,
			systemPrompt: DatasetPredictDirect.defaultPredictOptions.systemPrompt,
			userPrompt: DatasetPredictDirect.defaultPredictOptions.userPrompt,
		},
		explicitOptions: {
		}
	})
	if (options.modelName !== undefined) predictionMetadataJson.explicitOptions.modelName = options.modelName
	if (options.systemPrompt !== undefined) predictionMetadataJson.explicitOptions.systemPrompt = options.systemPrompt
	if (options.userPrompt !== undefined) predictionMetadataJson.explicitOptions.userPrompt = options.userPrompt
	// save a metadata.json file
	await Utils.savePredictionMetadataJson(evaluationName, predictionName, predictionMetadataJson)

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	compute modelName
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////


	// trick to have modelName be a path up to this point, now we take the basename
	// - this helps the command line writing thanks bash autocompletion and using ./models/ folder
	let modelName = options.modelName
	if (modelName) {
		modelName = Path.basename(modelName)
	}
	// assigned modelName if not defined
	if (modelName === undefined) {
		modelName = DatasetPredictDirect.defaultPredictOptions.modelName
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	do the prediction itself
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// do the actual prediction
	const predictionJson = await DatasetPredictDirect.predict(evaluationName, predictionName, {
		modelName: modelName,
		systemPrompt: options.systemPrompt,
		userPrompt: options.userPrompt,
		// verbose: true
	})

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Output
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// save a prediction.json file
	await Utils.savePredictionJson(evaluationName, predictionName, predictionJson);


	console.log(`Prediction OUTPUT by ${CliColor.red(modelName)}`)
	console.log(`${JSON.stringify(predictionJson, null, '\t')}`)
}

/**
 * 
 * @param {string} evaluationName 
 * @param {string} predictionName
 * @param {object} options
 * @param {string=} options.modelName
 * @param {string=} options.systemPrompt
 * @param {string=} options.userPrompt
 */
async function doDatasetPredictLangchain(evaluationName, predictionName, options = {}) {	// build a metadata.json file

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	if it already exists, skip
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	if (await Utils.hasPredictionMetadataJson(evaluationName, predictionName) && await Utils.hasPredictionJson(evaluationName, predictionName)) {
		console.log(`Predict for ${evaluationName}/${predictionName} already exists, skipping...`)
		return
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Build and save .prediction-metadata.json file
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	const metadataJson = /** @type {import("../src/type.d.js").PredictionMetadataJson} */({
		defaultOptions: {
			modelName: DatasetPredictLangchain.defaultPredictOptions.modelName,
			systemPrompt: DatasetPredictLangchain.defaultPredictOptions.systemPrompt,
			userPrompt: DatasetPredictLangchain.defaultPredictOptions.userPrompt,
		},
		explicitOptions: {
		}
	})
	if (options.modelName !== undefined) metadataJson.explicitOptions.modelName = options.modelName
	if (options.systemPrompt !== undefined) metadataJson.explicitOptions.systemPrompt = options.systemPrompt
	if (options.userPrompt !== undefined) metadataJson.explicitOptions.userPrompt = options.userPrompt
	// save a metadata.json file
	await Utils.savePredictionMetadataJson(evaluationName, predictionName, metadataJson)

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	compute modelName
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////


	// trick to have modelName be a path up to this point, now we take the basename
	// - this helps the command line writing thanks bash autocompletion and using ./models/ folder
	let modelName = options.modelName
	// assigned modelName if not defined
	if (modelName === undefined) {
		modelName = DatasetPredictLangchain.defaultPredictOptions.modelName
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	compute modelName
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// do the actual prediction
	const predictionJson = await DatasetPredictLangchain.predict(evaluationName, predictionName, {
		modelName: modelName,
		systemPrompt: options.systemPrompt,
		userPrompt: options.userPrompt,
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

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	if it already exists, skip
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	if (await Utils.hasEvaluationJson(evaluationName, predictionName)) {
		console.log(`Evaluate for ${evaluationName}/${predictionName} already exists, skipping...`)
		return
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	
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

	const hpTuningName = Path.basename(hpTuningPath, '.hptuning.json')
	const hpTuningJson = await Utils.loadHpTuningJson(hpTuningName)

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// do all the prediction
	for (const hpTuningPrediction of hpTuningJson.predictions) {
		const itemIndex = hpTuningJson.predictions.indexOf(hpTuningPrediction)
		const predictionName = hpTuningPrediction.predictionName ?? `hp_${hpTuningJson.hpTuningName}_${itemIndex}`
		const shouldUseDirect = hpTuningPrediction.modelName?.endsWith('.gguf') || hpTuningPrediction.modelName === undefined
		if (shouldUseDirect) {
			await doDatasetPredictDirect(evaluationName, predictionName, {
				modelName: hpTuningPrediction.modelName,
				systemPrompt: hpTuningPrediction.systemPrompt,
				userPrompt: hpTuningPrediction.userPrompt,
			})
		} else {
			// debugger
			await doDatasetPredictLangchain(evaluationName, predictionName, {
				modelName: hpTuningPrediction.modelName,
				systemPrompt: hpTuningPrediction.systemPrompt,
				userPrompt: hpTuningPrediction.userPrompt,
			})
		}
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// do all the evaluate
	for (const hpTuningPrediction of hpTuningJson.predictions) {
		const itemIndex = hpTuningJson.predictions.indexOf(hpTuningPrediction)
		const predictionName = hpTuningPrediction.predictionName ?? `hp_${hpTuningJson.hpTuningName}_${itemIndex}`
		await doDatasetEvaluateLangchain(evaluationName, predictionName)
	}
}