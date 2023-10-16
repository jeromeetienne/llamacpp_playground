// node imports
import Path from "path";

// langchain imports
import { loadEvaluator } from "langchain/evaluation";
import { OpenAI } from "langchain/llms/openai";

// local imports
import Utils from "../../src/utils.js";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const evaluationName = 'myeval'

const contextText = await Utils.loadText()
const datasetJson = await Utils.loadDatasetJson(evaluationName)
const predictionJson = await Utils.loadPredictionJson(evaluationName)
const evaluationJson = await Utils.loadEvaluationJson(evaluationName)
// sanity check
console.assert(datasetJson.length === predictionJson.length, `datasetJson.length (${datasetJson.length}) !== predictionJson.length (${predictionJson.length})`)
console.assert(datasetJson.length === evaluationJson.length, `datasetJson.length (${datasetJson.length}) !== evaluationJson.length (${predictionJson.length})`)

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//      build report array
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const reportArrayJson = /** @type {import("./type.d.js").ReportArrayJson} */([])
for (const datasetItem of datasetJson) {
	const itemIndex = datasetJson.indexOf(datasetItem)
	const predictionItem = predictionJson[itemIndex]
	const evaluationItem = evaluationJson[itemIndex]

        const reportItemJson = /** @type {import("./type.d.js").ReportItemJson} */({
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
for(const reportItem of reportArrayJson) {
        if( reportItem.predictionValid ) validCount+=1
}
const evaluationScore = validCount/reportArrayJson.length
console.log(`dataset: ${reportArrayJson.length} items`)
console.log(`validCount: ${validCount}`)
console.log(`Evaluation score: ${(evaluationScore*100).toFixed(2)}%`)

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	display invalid items
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

for(const reportItem of reportArrayJson) {
        const itemIndex = reportArrayJson.indexOf(reportItem)
        if( reportItem.predictionValid ){
                continue 
        }
        console.log(`items ${itemIndex} INVALID`)
        console.log(JSON.stringify(reportItem, null, '\t'))
}

const hasInvalidItems = reportArrayJson.some(reportItem => reportItem.predictionValid === false)
if( hasInvalidItems === false ) {
        console.log('No invalid items')
}
