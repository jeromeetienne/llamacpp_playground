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
import RecordGenerateLlamaCpp from "../src/helpers_generation/record_generate_llamacpp.js"
import RecordGenerateLangchain from "../src/helpers_generation/record_generate_langchain.js"
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

	cmdline.command('dataset_basicQa')
		.description('generate the dataset for a personality')
		.action(async (personalityName, options) => {
			await generateDatasetBasicQa()
		});
	cmdline.command('dataset_translateFrench')
		.description('generate the dataset for a personality')
		.action(async (personalityName, options) => {
			await generateDatasetTranslateFrench()
		});
	cmdline.command('dataset_stateUnionQa')
		.description('generate the dataset for a personality')
		.action(async (personalityName, options) => {
			await generateDatasetStateUnionQa()
		});
	cmdline.command('gridsearch_translateFrench')
		.description('generate the hptuning.json+.gridsearch.json for translateFrench')
		.action(async (personalityName, options) => {
			await generateGridSearchTranslateFrench()
		});
	cmdline.command('gridsearch_onlyBlah')
		.description('generate the hptuning.json+.gridsearch.json for onlyBlah')
		.action(async (personalityName, options) => {
			await generateGridSearchOnlyBlah()
		});
	cmdline.command('gridsearch_testAccuracy')
		.description('generate the hptuning.json+.gridsearch.json for testAccuracy')
		.action(async (personalityName, options) => {
			await generateGridSearchTestAccuracy()
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

async function generateDatasetBasicQa() {
	// build the record schema
	const recordZodSchema = Zod.object({
		question: Zod.string().describe('a short simple question'),
		answer: Zod.string().describe('the response to the question'),
	})
	const recordCount = 5

	// generate the records
	let recordsJson = /** @type {array} */([])
	const useDirect = true
	if( useDirect ){
		recordsJson = await RecordGenerateLlamaCpp.generateRecordsFromZod(recordZodSchema, {
			recordCount
		})
	}else{
		recordsJson = await RecordGenerateLangchain.generateRecordsFromZod(recordZodSchema, {
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
	const datasetName = `basicQa`
	await Utils.saveDatasetJsonNew(datasetName, datasetJson)
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function generateDatasetTranslateFrench() {
	// build the record schema
	const recordZodSchema = Zod.object({
		sentence: Zod.string().describe('a short simple sentence'),
		frenchSentence: Zod.string().describe('the french translation of the sentence'),
	})
	const recordCount = 5

	// generate the records
	let recordsJson = /** @type {array} */([])
	const useDirect = true
	if( useDirect ){
		recordsJson = await RecordGenerateLlamaCpp.generateRecordsFromZod(recordZodSchema, {
			// modelName: ModelPathContants.LLAMA_2_7B_CHAT_Q6_K,
			recordCount
		})
	}else{
		recordsJson = await RecordGenerateLangchain.generateRecordsFromZod(recordZodSchema, {
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
	const datasetName = `translateFrench`
	await Utils.saveDatasetJsonNew(datasetName, datasetJson)
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function generateDatasetStateUnionQa() {
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
	if( useDirect ){
		recordsJson = await RecordGenerateLlamaCpp.generateRecordsFromZod(recordZodSchema, {
			recordCount,
			context,
		})
	}else{
		recordsJson = await RecordGenerateLangchain.generateRecordsFromZod(recordZodSchema, {
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
	const datasetName = `stateUnionQa`
	await Utils.saveDatasetJsonNew(datasetName, datasetJson)
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function generateGridSearchTranslateFrench() {

	const gridSearchJson = /** @type {import("../src/type.d.js").GridSearchJson} */({
		hpTuningName: `gridsearch_translateFrench`,
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


async function generateGridSearchTestAccuracy() {

	const gridSearchJson = /** @type {import("../src/type.d.js").GridSearchJson} */({
		hpTuningName: `gridsearch_testAccuracy`,
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


