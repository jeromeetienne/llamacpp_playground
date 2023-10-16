// local imports
import Utils from "../../src/utils.js";



///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {Object} DatasetReportOptions
 * @property {Boolean} verbose
 */

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default class DatasetReport {

        /**
         * @param {string} evaluationName
         * @param {string} predictionName
         * @param {Partial<DatasetReportOptions>} partialOptions
         */
        static async build(evaluationName, predictionName, partialOptions = {}) {

                // handle default options
                partialOptions = Object.assign({}, /** @type {DatasetReportOptions} */({
                        verbose: false,
                }), partialOptions)
                const options = /** @type {DatasetReportOptions} */(partialOptions)

                ///////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////
                //	
                ///////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////

                // const evaluationName = 'myeval'
                const datasetJson = await Utils.loadDatasetJson(evaluationName)
                const predictionJson = await Utils.loadPredictionJson(evaluationName, predictionName)
                const evaluationJson = await Utils.loadEvaluationJson(evaluationName, predictionName)
                // sanity check
                console.assert(datasetJson.length === predictionJson.length, `datasetJson.length (${datasetJson.length}) !== predictionJson.length (${predictionJson.length})`)
                console.assert(datasetJson.length === evaluationJson.length, `datasetJson.length (${datasetJson.length}) !== evaluationJson.length (${predictionJson.length})`)

                ///////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////
                //      build report array
                ///////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////

                const reportArrayJson = /** @type {import("../../src/type.d.js").ReportArrayJson} */([])
                for (const datasetItem of datasetJson) {
                        const itemIndex = datasetJson.indexOf(datasetItem)
                        const predictionItem = predictionJson[itemIndex]
                        const evaluationItem = evaluationJson[itemIndex]

                        const reportItemJson = /** @type {import("../../src/type.d.js").ReportItemJson} */({
                                question: datasetItem.question,
                                trueAnswer: datasetItem.trueAnswer,
                                predictedAnswer: predictionItem.predictedAnswer,
                                predictionValid: evaluationItem.predictionValid,
                        })
                        reportArrayJson.push(reportItemJson)
                }

                console.log(`OUTPUT`)
                console.log(`${JSON.stringify(reportArrayJson, null, '\t')}`)

                ///////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////
                //	display statistics
                ///////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////

                let validCount = 0
                for (const reportItem of reportArrayJson) {
                        if (reportItem.predictionValid) validCount += 1
                }
                const evaluationScore = validCount / reportArrayJson.length
                console.log(`dataset: ${reportArrayJson.length} items`)
                console.log(`validCount: ${validCount}`)
                console.log(`Evaluation score: ${(evaluationScore * 100).toFixed(2)}%`)

                ///////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////
                //	display invalid items
                ///////////////////////////////////////////////////////////////////////////////
                ///////////////////////////////////////////////////////////////////////////////

                const hasInvalidItems = reportArrayJson.some(reportItem => reportItem.predictionValid === false)
                if (hasInvalidItems === false) {
                        console.log('No invalid items')
                } else {
                        for (const reportItem of reportArrayJson) {
                                const itemIndex = reportArrayJson.indexOf(reportItem)
                                if (reportItem.predictionValid) {
                                        continue
                                }
                                console.log(`items ${itemIndex} INVALID`)
                                console.log(JSON.stringify(reportItem, null, '\t'))
                        }
                }
        }
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Usage example
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

async function mainAsync() {
        const evaluationName = 'myeval'
        await DatasetReport.build(evaluationName, {
                verbose: true,
        })
}

// run mainAsync() if this file is run directly from node.js
import { fileURLToPath } from 'url';
const runAsMainModule = process.argv[1] === fileURLToPath(import.meta.url)
if (runAsMainModule) {
        // call mainAsync()
        await mainAsync()
}