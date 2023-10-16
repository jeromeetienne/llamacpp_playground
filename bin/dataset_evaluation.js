#!/usr/bin/env node

// node imports
import Path from "path"
import Fs from "fs"

// npm imports
import * as Commander from "commander"
import CliColor from "cli-color"

// local imports
import AvailableModelPaths from "../src/available_model_paths.js"
import DatasetGenerateDirect from "./dataset_evaluation_helpers/dataset_generate_direct.js"
import DatasetGenerateLangchain from "./dataset_evaluation_helpers/dataset_generate_langchain.js"
import DatasetPredictDirect from "./dataset_evaluation_helpers/dataset_predict_direct.js"
import DatasetPredictLangchain from "./dataset_evaluation_helpers/dataset_predict_langchain.js"
import DatasetEvaluateLangchain from "./dataset_evaluation_helpers/dataset_evaluate_langchain.js"
import DatasetReport from "./dataset_evaluation_helpers/dataset_report.js"

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
                .option('-l, --langchain', 'generate the dataset using langchain', false)
                .option('-d, --direct', 'generate the dataset using node-llama-cpp', true)
                .option('-n, --nquestions <number>', 'number of questions to generate', parseFloat)
                .action(async (evaluationName, modelName, options) => {
                        if (options.langchain) {
                                await doDatasetGenerateLangchain(evaluationName, modelName, options.nquestions)
                        } else if (options.direct) {
                                await doDatasetGenerateDirect(evaluationName, modelName, options.nquestions)
                        } else {
                                console.error(CliColor.redBright(`ERROR: invalid options`))
                                cmdline.help()
                                process.exit(1)
                        }
                });

        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        //	
        ///////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////

        cmdline.command('predict <evaluationName> <predictionName> modelName]')
                .description('predict on the dataset')
                .option('-l, --langchain', 'generate the dataset using langchain', false)
                .option('-d, --direct', 'generate the dataset using node-llama-cpp', true)
                .action(async (evaluationName, predictionName, modelName, options) => {
                        if (options.langchain) {
                                await doDatasetPredictLangchain(evaluationName, predictionName, modelName)
                        } else if (options.direct) {
                                await doDatasetPredictDirect(evaluationName, predictionName, modelName)
                        } else {
                                console.error(CliColor.redBright(`ERROR: invalid options`))
                                cmdline.help()
                                process.exit(1)
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

        cmdline.command('report <evaluationName> <predictionName>')
                .description('Print a report on the dataset evaluation')
                .action(async (evaluationName, predictionName, options) => {
                        await doDatasetReport(evaluationName, predictionName)
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
        console.log({ datasetJson })
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
        console.log({ datasetJson })
}

/**
 * 
 * @param {string} evaluationName 
 * @param {string} predictionName
 * @param {string=} modelName
 */
async function doDatasetPredictDirect(evaluationName, predictionName, modelName = undefined) {
        if (modelName) {
                modelName = Path.basename(modelName)
        }
        modelName = modelName ?? AvailableModelPaths.LLAMA_2_7B_CHAT_Q2_K
        const predictionJson = await DatasetPredictDirect.predict(evaluationName, predictionName, modelName, {
                // verbose: true
        })
        console.log({ predictionJson })
}

/**
 * 
 * @param {string} evaluationName 
 * @param {string} predictionName
 * @param {string=} modelName
 */
async function doDatasetPredictLangchain(evaluationName, predictionName, modelName = undefined) {
        modelName = modelName ?? 'gpt-3.5-turbo'
        const predictionJson = await DatasetPredictLangchain.predict(evaluationName, predictionName, modelName, {
                // verbose: true
        })
        console.log({ predictionJson })
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
        console.log({ predictionJson: evaluationJson })
}

/**
 * 
 * @param {string} evaluationName 
 * @param {string} predictionName
 */
async function doDatasetReport(evaluationName, predictionName) {
        await DatasetReport.build(evaluationName, predictionName,{
                // verbose: true
        })
}