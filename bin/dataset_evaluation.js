#!/usr/bin/env node

// node imports
import Path from "path"
import Fs from "fs"

// npm imports
import * as Commander from "commander"
import CliColor from "cli-color"

// local imports
import DatasetGenerateDirect from "./dataset_generate_direct.js"
import DatasetGenerateLangchain from "./dataset_generate_langchain.js"
import DatasetPredictDirect from "./dataset_predict_direct.js"
import DatasetPredictLangchain from "./dataset_predict_langchain.js"
import AvailableModelPaths from "../src/available_model_paths.js"
import LlamaUtils from "../src/llama-utils.js"

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
		.description('dataset_evaluation.js - perform all evaluations on a named dataset');

                cmdline.command('generate')
		.description('generate the dataset')
		.action(async (options) => {
                        await doDatasetGenerateDirect()
                        // await doDatasetGenerateLangchain()
		});

                cmdline.command('predict')
		.description('predict on the dataset')
		.action(async (options) => {
                        // await doDatasetPredictDirect()
                        await doDatasetPredictLangchain()
		});

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

async function doDatasetGenerateDirect() {
        const modelName = AvailableModelPaths.LLAMA_2_7B_CHAT_Q2_K
        const evaluationName = 'myeval'
        const datasetJson = await DatasetGenerateDirect.generate(modelName, evaluationName, {
                nQuestions: 1,
        })
        console.log({datasetJson})
}

async function doDatasetGenerateLangchain() {
        const modelName = 'gpt-3.5-turbo'
        const evaluationName = 'myeval'
	const datasetJson = await DatasetGenerateLangchain.generate(modelName, evaluationName, {
		verbose: true
	})
        console.log({datasetJson})
}

async function doDatasetPredictDirect() {
        const modelName = AvailableModelPaths.LLAMA_2_7B_CHAT_Q2_K
        const evaluationName = 'myeval'
        const predictionJson = await DatasetPredictDirect.predict(modelName, evaluationName, {
                verbose: true
        })
        console.log({predictionJson})
}

async function doDatasetPredictLangchain() {
        const modelName = 'gpt-3.5-turbo'
        const evaluationName = 'myeval'
        const predictionJson = await DatasetPredictLangchain.predict(modelName, evaluationName, {
                verbose: true
        })
        console.log({predictionJson})
}