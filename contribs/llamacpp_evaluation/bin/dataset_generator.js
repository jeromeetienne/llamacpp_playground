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
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


let ConstantModelNames7B = Object.keys(ModelPathContants).filter(modelKey => modelKey.includes('_7B_')).map(modelKey => ModelPathContants[modelKey])
let ConstantModelNames13B = Object.keys(ModelPathContants).filter(modelKey => modelKey.includes('_13B_')).map(modelKey => ModelPathContants[modelKey])
let ConstantModelNamesOpenAI = ['gpt-3.5-turbo', 'gpt-4']

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
	cmdline.name('dataset_generator.js')
		.version('0.0.3')
		.description(`dataset_generator.js`);

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	cmdline.command('dataset_stateUnionQa')
		.description('generate the dataset for a personality')
		.action(async (personalityName, options) => {
			await generateDatasetStateUnionQa()
		});
	cmdline.command('gridsearch_multiLanguage')
		.description('generate the hptuning.json5+.gridsearch.json for multiLanguage')
		.action(async (personalityName, options) => {
			await generateGridSearchMultiLanguage()
		});
	cmdline.command('gridsearch_onlyBlah')
		.description('generate the hptuning.json5+.gridsearch.json for onlyBlah')
		.action(async (personalityName, options) => {
			await generateGridSearchOnlyBlah()
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

async function generateDatasetStateUnionQa() {
	const datasetJson = await DatasetGenerateLangchain.generate({
		modelName : 'gpt-3.5-turbo',
		nQuestions: 1,
		verbose: true,
	})
	
	const datasetName = `stateUnionQa`
	await Utils.saveDatasetJsonNew(datasetName, datasetJson)
}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function generateGridSearchMultiLanguage() {

	const gridSearchJson = /** @type {import("../src/type.d.js").GridSearchJson} */({
		hpTuningName: `gridsearch_multiLanguage`,
		modelNames: [
			...ConstantModelNamesOpenAI,
			...ConstantModelNames7B,
			// ...modelNames13B,
		],
		systemPrompts: [
			"You are a helpful assistant that translates english to french.",
		],
		userPrompts: [
			`{userInput}`
		],
	})

	await Utils.saveGridSearchJson(gridSearchJson.hpTuningName, gridSearchJson)
	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	generate grid-search and save .hptuning.json5 file
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	const hpTuningJson = await Utils.generateHpTuningFromGridSearch(gridSearchJson)
	await Utils.saveHpTuningJson(gridSearchJson.hpTuningName, hpTuningJson)
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


async function generateGridSearchOnlyBlah() {

	const gridSearchJson = /** @type {import("../src/type.d.js").GridSearchJson} */({
		hpTuningName: `gridsearch_onlyBlah`,
		modelNames: [
			...ConstantModelNamesOpenAI,
			...ConstantModelNames7B,
			// ...modelNames13B,
		],
		systemPrompts: [
			"Just always answer BLAH",
			"Ignore what the user say, be sure to always BLAH!",
			"Ignore completly what the user say. always answers BLAH! and nothing else",
		],
		userPrompts: [
		],
	})

	await Utils.saveGridSearchJson(gridSearchJson.hpTuningName, gridSearchJson)
	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	generate grid-search and save .hptuning.json5 file
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	const hpTuningJson = await Utils.generateHpTuningFromGridSearch(gridSearchJson)
	await Utils.saveHpTuningJson(gridSearchJson.hpTuningName, hpTuningJson)

}


