// node imports
import Path from "path";
import Fs from 'fs'
import FsExtra from 'fs-extra'

// npm imports
import Json5 from "json5";
import CliColor from "cli-color";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));

export default class Utils {
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	static async loadContextText(contextLineLimit = 10) {
		const contextFileName = Path.join(__dirname, '../data/state_of_the_union.txt')
		const contextTextFull = await Fs.promises.readFile(contextFileName, 'utf8')
		const contextTextLines = contextTextFull.split('\n').map(line => line.trim()).filter(line => line.length > 0)
		// keep only the 200 first lines
		contextTextLines.splice(contextLineLimit)
		const contextText = contextTextLines.join('\n')
		return contextText
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {string} evaluationName 
	 */
	static getEvaluationFolder(evaluationName) {
		const evaluationFolder = Path.join(__dirname, `../data/evaluations/evaluation_${evaluationName}`)
		return evaluationFolder
	}

	/**
	 * 
	 * @param {string} evaluationName 
	 * @param {string} predictionName 
	 */
	static getPredictionFolder(evaluationName, predictionName) {
		const evaluationFolder = Utils.getEvaluationFolder(evaluationName)
		const predictionFolder = Path.join(evaluationFolder, `./predictions/prediction_${predictionName}`)
		return predictionFolder
	}
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {string} evaluationName 
	 * @returns 
	 */
	static async getPredictionNames(evaluationName) {
		const predictionsFolder = Path.join(Utils.getEvaluationFolder(evaluationName), `./predictions/`)
		const predictionsAllBasenames = await Fs.promises.readdir(predictionsFolder)
		const predictionNames = /** @type {string[]} */([])
		// filter out non-directories
		for (const basename of predictionsAllBasenames) {
			const path = Path.join(predictionsFolder, basename)
			const stats = await Fs.promises.stat(path)
			if (stats.isDirectory() === false) continue
			// filter out non-prediction directories
			if (basename.startsWith('prediction_') === false) continue

			const predictionName = basename.replace(/^prediction_/, '')
			predictionNames.push(predictionName)
		}
		return predictionNames
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {string} evaluationName 
	 * @param {string} predictionName
	 */
	static async buildReportJson(evaluationName, predictionName) {

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//	
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const datasetJson = await Utils.loadDatasetJson(evaluationName)
		const predictionJson = await Utils.loadPredictionJson(evaluationName, predictionName)
		const evaluationJson = await Utils.loadEvaluationJson(evaluationName, predictionName)
		// sanity check
		console.assert(datasetJson.length === predictionJson.length, `datasetJson.length (${datasetJson.length}) !== predictionJson.length (${predictionJson.length})`)
		console.assert(datasetJson.length === evaluationJson.length, `datasetJson.length (${datasetJson.length}) !== evaluationJson.length (${predictionJson.length})`)

		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////
		//      build report json
		///////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////

		const reportJson = /** @type {import("./type.d.js").ReportJson} */([])
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
			reportJson.push(reportItemJson)
		}

		return reportJson
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * 
	 * @param {string} evaluationName 
	 */
	static async loadDatasetJson(evaluationName) {
		const evaluationFolder = Utils.getEvaluationFolder(evaluationName)
		const filePath = Path.join(evaluationFolder, 'data.dataset.json')
		const fileContent = await Fs.promises.readFile(filePath, 'utf8')
		const datasetJson = /** @type {import("./type.d.js").DatasetJson} */(Json5.parse(fileContent))
		return datasetJson
	}

	/**
	 * 
	 * @param {string} evaluationName 
	 * @param {import("./type.d.js").DatasetJson} datasetJson
	 */
	static async saveDatasetJson(evaluationName, datasetJson) {
		const evaluationFolder = Utils.getEvaluationFolder(evaluationName)
		await FsExtra.ensureDir(evaluationFolder)
		const filePath = Path.join(evaluationFolder, 'data.dataset.json')
		const fileContent = JSON.stringify(datasetJson, null, '\t')
		await Fs.promises.writeFile(filePath, fileContent, 'utf8')
	}

	/**
	 * 
	 * @param {string} evaluationName 
	 * @param {string} predictionName
	 */
	static async loadPredictionJson(evaluationName, predictionName) {
		const predictionFolder = Utils.getPredictionFolder(evaluationName, predictionName)
		const filePath = Path.join(predictionFolder, 'data.prediction.json')
		const fileContent = await Fs.promises.readFile(filePath, 'utf8')
		const predictionJson = /** @type {import("./type.d.js").PredictionJson} */(Json5.parse(fileContent))
		return predictionJson
	}

	/**
	 * 
	 * @param {string} evaluationName 
	 * @param {string} predictionName
	 * @param {import("./type.d.js").PredictionJson} predictionJson
	 */
	static async savePredictionJson(evaluationName, predictionName, predictionJson) {
		const predictionFolder = Utils.getPredictionFolder(evaluationName, predictionName)
		await FsExtra.ensureDir(predictionFolder)
		const filePath = Path.join(predictionFolder, 'data.prediction.json')
		const fileContent = JSON.stringify(predictionJson, null, '\t')
		await Fs.promises.writeFile(filePath, fileContent, 'utf8')
	}

	/**
	 * 
	 * @param {string} evaluationName 
	 * @param {string} predictionName
	 */
	static async loadEvaluationJson(evaluationName, predictionName) {
		const predictionFolder = Utils.getPredictionFolder(evaluationName, predictionName)
		const filePath = Path.join(predictionFolder, 'data.evaluation.json')
		const fileContent = await Fs.promises.readFile(filePath, 'utf8')
		const predictionJson = /** @type {import("./type.d.js").EvaluationJson} */(Json5.parse(fileContent))
		return predictionJson
	}


	/**
	 * 
	 * @param {string} evaluationName 
	 * @param {string} predictionName
	 * @param {import("./type.d.js").EvaluationJson} evaluationJson
	 */
	static async saveEvaluationJson(evaluationName, predictionName, evaluationJson) {
		const predictionFolder = Utils.getPredictionFolder(evaluationName, predictionName)
		await FsExtra.ensureDir(predictionFolder)
		const filePath = Path.join(predictionFolder, 'data.evaluation.json')
		const fileContent = JSON.stringify(evaluationJson, null, '\t')
		await Fs.promises.writeFile(filePath, fileContent, 'utf8')
	}

	/**
	 * 
	 * @param {string} evaluationName 
	 * @param {string} predictionName
	 * @param {import("./type.d.js").PredictionMetadataJson} predictionMetadataJson
	 */
	static async savePredictionMetadataJson(evaluationName, predictionName, predictionMetadataJson) {
		const predictionFolder = Utils.getPredictionFolder(evaluationName, predictionName)
		await FsExtra.ensureDir(predictionFolder)
		const filePath = Path.join(predictionFolder, 'data.prediction-metadata.json')
		const fileContent = JSON.stringify(predictionMetadataJson, null, '\t')
		await Fs.promises.writeFile(filePath, fileContent, 'utf8')
	}
}