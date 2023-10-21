#!/usr/bin/env node

// node imports
import Path from "path"
import Fs from "fs"

// npm imports
import * as Commander from "commander"
import CliColor from "cli-color"
import FsExtra from "fs-extra"

// local imports
// import ModelPathContants from "../../../src/model_path_constants.js"
// import DatasetGenerateDirect from "../src/helpers/dataset_generate_direct.js"
// import DatasetGenerateLangchain from "../src/helpers/dataset_generate_langchain.js"
import DatasetPredictDirect from "../src/helpers/dataset_predict_direct.js"
import DatasetPredictLangchain from "../src/helpers/dataset_predict_langchain.js"
import DatasetEvaluateLangchain from "../src/helpers/dataset_evaluate_langchain.js"
import EvaluationReport from "../src/helpers/evaluation_report.js"
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

	cmdline.command('create <evaluationName> <datasetPath> <hpTuningPath>')
		.description('generate an evaluation from a dataset and a hpTuning file.')
		.action(async (evaluationName, datasetPath, hpTuningPath, options) => {
			await doEvaluationCreate(evaluationName, datasetPath, hpTuningPath)
		});

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	cmdline.command('delete <evaluationName>')
		.description('delete an evaluation. WARNING: this is irreversible.')
		.action(async (evaluationName, options) => {
			await doEvaluationDelete(evaluationName)
		});

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	cmdline.command('predictOne <evaluationName> <predictionName> [modelName]')
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
				await doDatasetPredictOneDirect(evaluationName, predictionName, { modelName })
			} else {
				await doDatasetPredictOneLangchain(evaluationName, predictionName, { modelName })
			}
		});

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	cmdline.command('evaluateOne <evaluationName> <predictionName>')
		.description('evaluate the prediction based on the dataset')
		.action(async (evaluationName, predictionName, options) => {
			await doDatasetEvaluateOneLangchain(evaluationName, predictionName)
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

	cmdline.command('compute <evaluationName>')
		.description('Do hyperparameters tuning for a given .hptuning.json file')
		.action(async (evaluationName, options) => {
			await doComputeEvaluation(evaluationName)
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
 * @param {string} datasetSrcPath 
 * @param {string} hpTuningSrcPath 
 * @returns 
 */
async function doEvaluationCreate(evaluationName, datasetSrcPath, hpTuningSrcPath) {
	// create the folder if needed
	const evaluationFolder = Utils.getEvaluationFolder(evaluationName)
	await FsExtra.ensureDir(evaluationFolder)

	// copy .dataset.json file
	const datasetBaseName = Path.basename(datasetSrcPath)
	const datasetDstPath = Path.join(evaluationFolder, 'data.dataset.json')
	await FsExtra.copy(datasetSrcPath, datasetDstPath)

	// copy .hptuning.json file
	const hpTuningBaseName = Path.basename(hpTuningSrcPath)
	const hpTuningDstPath = Path.join(evaluationFolder, 'data.hptuning.json')
	await FsExtra.copy(hpTuningSrcPath, hpTuningDstPath)

	console.log(`Created evaluation ${CliColor.blue(evaluationName)} with dataset ${CliColor.blue(datasetBaseName)} and hpTuning ${CliColor.blue(hpTuningBaseName)}`)
}

/**
 * 
 * @param {string} evaluationName 
 */
async function doEvaluationDelete(evaluationName) {
	// create the folder if needed
	const evaluationFolder = Utils.getEvaluationFolder(evaluationName)
	// delete the folder
	await FsExtra.remove(evaluationFolder)

	// log for the user
	console.log(`Deleted evaluation ${CliColor.blue(evaluationName)}`)
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
async function doDatasetPredictOneDirect(evaluationName, predictionName, options = {}) {

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
async function doDatasetPredictOneLangchain(evaluationName, predictionName, options = {}) {	// build a metadata.json file

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
async function doDatasetEvaluateOneLangchain(evaluationName, predictionName) {

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
	await EvaluationReport.display(evaluationName, {
		verbose: true
	})
}


/**
 * 
 * @param {string} evaluationName 
 */
async function doComputeEvaluation(evaluationName) {

	const hpTuningJson = await Utils.loadEvaluationHpTuningJson(evaluationName)

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
			await doDatasetPredictOneDirect(evaluationName, predictionName, {
				modelName: hpTuningPrediction.modelName,
				systemPrompt: hpTuningPrediction.systemPrompt,
				userPrompt: hpTuningPrediction.userPrompt,
			})
		} else {
			// debugger
			await doDatasetPredictOneLangchain(evaluationName, predictionName, {
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
		await doDatasetEvaluateOneLangchain(evaluationName, predictionName)
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Display report
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	await doDatasetReport(evaluationName)
}