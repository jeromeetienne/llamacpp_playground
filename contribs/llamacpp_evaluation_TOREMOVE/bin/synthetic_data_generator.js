#!/usr/bin/env node

// node imports
import Path from "path"
import Fs from "fs"

// npm imports
import * as Commander from "commander"
import CliColor from "cli-color"
import Zod from "zod"

// local imports
import ModelPathContants from "../../../src/model_path_constants.js"
import RecordGenerateLlamaCpp from "../src/records_generator/record_generate_llamacpp.js"
import RecordGenerateLangchain from "../src/records_generator/record_generate_langchain.js"
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
const debug = Debug('llamacpp_evaluation')

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////


let ConstantModelNames7B = Object.keys(ModelPathContants).filter(modelKey => modelKey.includes('_7B_')).map(modelKey => ModelPathContants[modelKey])
let ConstantModelNames13B = Object.keys(ModelPathContants).filter(modelKey => modelKey.includes('_13B_')).map(modelKey => ModelPathContants[modelKey])
let ConstantModelNamesOpenAI = ['gpt-3.5-turbo', 'gpt-4']

const datasetInfos = [
	{
		datasetName: 'basicQa',
		description: 'generate the dataset for a basicQa. It is a simple question/answer dataset. Question are "common knowledge" learned by the model, not according to a context',
	},
	{
		datasetName: 'translateFrench',
		description: 'generate the dataset for a translateFrench. It has simple english sentences and their french translation',
	},
	{
		datasetName: 'stateUnionQa',
		description: 'generate the dataset for a stateUnionQa. It is a question/answer dataset. Question are based on a context (the state union)',
	}
]
const gridSearchInfos = [
	{
		gridSearchName: 'translateFrench',
		description: 'generate the gridSearch for a translateFrench. It is an experiment to see if the model can learn to translate french',
	},
	{
		gridSearchName: 'onlyBlah',
		description: 'generate the gridSearch for a onlyBlah. It is an experiment to see if the model can learn to always answer BLAH',
	},
	{
		gridSearchName: 'testAccuracy',
		description: 'generate the gridSearch for a testAccuracy. It is an experiment to see how accurate the model is to answer a question on a given context',
	}
]

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
	cmdline.name('synthetic_data_generator.js')
		.version('0.0.3')
		.description(`synthetic_data_generator.js`);

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	cmdline.command('dataset <datasetName>')
		.description('generate the dataset for a datasetName. use "list" to display the list of available dataset.')
		.action(async (datasetName, options) => {
			if (datasetName === 'list') {
				console.log(CliColor.underline('Authorized dataset names:'))
				for (const datasetInfo of datasetInfos) {
					console.log(`- ${CliColor.bold(datasetInfo.datasetName)}: ${datasetInfo.description}`)
				}
			} else if (datasetName === 'basicQa') {
				await generateDatasetBasicQa(datasetName)
			} else if (datasetName === 'translateFrench') {
				await generateDatasetTranslateFrench(datasetName)
			} else if (datasetName === 'stateUnionQa') {
				await generateDatasetStateUnionQa(datasetName)
			} else {
				console.error(CliColor.red(`unknown datasetName : ${datasetName}`))
				process.exit(1)
			}
		});

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	cmdline.command('gridsearch <grisSearchName>')
		.description(`generate the grisSearch for a grisSearchName. use "list" to display the list of available gridsearch.`)
		.action(async (gridSearchName, options) => {
			if (gridSearchName === 'list') {
				console.log(CliColor.underline('Authorized gridSearch names:'))
				for (const gridSearchInfo of gridSearchInfos) {
					console.log(`- ${CliColor.bold(gridSearchInfo.gridSearchName)}: ${gridSearchInfo.description}`)
				}
			} else if (gridSearchName === 'translateFrench') {
				await generateGridSearchTranslateFrench(`gridsearch_${gridSearchName}}`)
			} else if (gridSearchName === 'onlyBlah') {
				await generateGridSearchOnlyBlah(`gridsearch_${gridSearchName}}`)
			} else if (gridSearchName === 'testAccuracy') {
				await generateGridSearchTestAccuracy(`gridsearch_${gridSearchName}}`)
			} else {
				console.error(CliColor.red(`unknown gridSearchName : ${gridSearchName}`))
				process.exit(1)
			}
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
 * @param {string} datasetName 
 */
async function generateDatasetBasicQa(datasetName) {
	// build the record schema
	const recordZodSchema = Zod.object({
		question: Zod.string().describe('a short simple question'),
		answer: Zod.string().describe('the response to the question'),
	})
	const recordCount = 5

	// generate the records
	let recordsJson = /** @type {array} */([])
	const useDirect = true
	if (useDirect) {
		recordsJson = await RecordGenerateLlamaCpp.generateFromZod(recordZodSchema, {
			recordCount
		})
	} else {
		recordsJson = await RecordGenerateLangchain.generateFromZod(recordZodSchema, {
			recordCount
		})
	}

	// convert recordsJson to datasetJson
	const datasetJson = /** @type {import("../src/type.d.js").DatasetJson} */([])
	for (const fixtureJson of recordsJson) {
		const datasetItemJson = /** @type {import("../src/type.d.js").DatasetItemJson} */({
			userInput: fixtureJson.question,
			expectedResponse: fixtureJson.answer,
			context: '',
		})
		datasetJson.push(datasetItemJson)
	}

	// display to debug
	console.log(`datasetJson : ${JSON.stringify(datasetJson, null, '\t')}`)

	// save the dataset
	await Utils.saveDatasetJsonNew(datasetName, datasetJson)
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @param {string} datasetName 
 */
async function generateDatasetTranslateFrench(datasetName) {
	// build the record schema
	const recordZodSchema = Zod.object({
		sentence: Zod.string().describe('a short simple sentence'),
		frenchSentence: Zod.string().describe('the french translation of the sentence'),
	})
	const recordCount = 5

	// generate the records
	let recordsJson = /** @type {array} */([])
	const useDirect = true
	if (useDirect) {
		recordsJson = await RecordGenerateLlamaCpp.generateFromZod(recordZodSchema, {
			// modelName: ModelPathContants.LLAMA_2_7B_CHAT_Q6_K,
			recordCount
		})
	} else {
		recordsJson = await RecordGenerateLangchain.generateFromZod(recordZodSchema, {
			recordCount
		})
	}

	// convert recordsJson to datasetJson
	const datasetJson = /** @type {import("../src/type.d.js").DatasetJson} */([])
	for (const fixtureJson of recordsJson) {
		const datasetItemJson = /** @type {import("../src/type.d.js").DatasetItemJson} */({
			userInput: fixtureJson.sentence,
			expectedResponse: fixtureJson.frenchSentence,
			context: '',
		})
		datasetJson.push(datasetItemJson)
	}

	// display to debug
	console.log(`datasetJson : ${JSON.stringify(datasetJson, null, '\t')}`)

	// save the dataset
	await Utils.saveDatasetJsonNew(datasetName, datasetJson)
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @param {string} datasetName 
 */
async function generateDatasetStateUnionQa(datasetName) {
	// create record zod schema
	const recordZodSchema = Zod.object({
		question: Zod.string().describe('a short clear question based on the context'),
		answer: Zod.string().describe('the response to the question'),
	})
	// load the context we want to use
	const context = await Utils.loadContextStateUnion()
	const recordCount = 2

	// generate the records
	let recordsJson = /** @type {array} */([])
	const useDirect = true
	if (useDirect) {
		recordsJson = await RecordGenerateLlamaCpp.generateFromZod(recordZodSchema, {
			recordCount,
			context,
		})
	} else {
		recordsJson = await RecordGenerateLangchain.generateFromZod(recordZodSchema, {
			recordCount,
			context,
		})
	}

	// convert recordsJson to datasetJson
	const datasetJson = /** @type {import("../src/type.d.js").DatasetJson} */([])
	for (const recordJson of recordsJson) {
		const datasetItemJson = /** @type {import("../src/type.d.js").DatasetItemJson} */({
			userInput: recordJson.question,
			expectedResponse: recordJson.answer,
			context: context,
		})
		datasetJson.push(datasetItemJson)
	}

	// display to debug
	console.log(`datasetJson : ${JSON.stringify(datasetJson, null, '\t')}`)

	// save the dataset
	await Utils.saveDatasetJsonNew(datasetName, datasetJson)
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @param {string} hpTuningName 
 */
async function generateGridSearchTranslateFrench(hpTuningName) {

	const gridSearchJson = /** @type {import("../src/type.d.js").GridSearchJson} */({
		hpTuningName: hpTuningName,
		modelNames: [
			...ConstantModelNamesOpenAI,
			...ConstantModelNames7B,
			...ConstantModelNames13B,
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
	//	generate grid-search and save .hptuning.json file
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


/**
 * 
 * @param {string} hpTuningName 
 */
async function generateGridSearchOnlyBlah(hpTuningName) {

	const gridSearchJson = /** @type {import("../src/type.d.js").GridSearchJson} */({
		hpTuningName: hpTuningName,
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
	//	generate grid-search and save .hptuning.json file
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	// debugger
	const hpTuningJson = await Utils.generateHpTuningFromGridSearch(gridSearchJson)
	await Utils.saveHpTuningJson(gridSearchJson.hpTuningName, hpTuningJson)

}


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @param {string} hpTuningName 
 */
async function generateGridSearchTestAccuracy(hpTuningName) {

	const gridSearchJson = /** @type {import("../src/type.d.js").GridSearchJson} */({
		hpTuningName: hpTuningName,
		modelNames: [
			...ConstantModelNamesOpenAI,
			...ConstantModelNames7B,
			...ConstantModelNames13B,
		],
		systemPrompts: [
		],
		userPrompts: [
		],
	})

	await Utils.saveGridSearchJson(gridSearchJson.hpTuningName, gridSearchJson)

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	generate grid-search and save .hptuning.json file
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	// debugger
	const hpTuningJson = await Utils.generateHpTuningFromGridSearch(gridSearchJson)
	await Utils.saveHpTuningJson(gridSearchJson.hpTuningName, hpTuningJson)

}


