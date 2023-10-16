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
	 */
	static async loadDatasetJson(evaluationName) {
		const evaluationFolder = Utils.getEvaluationFolder(evaluationName)
		const filePath = Path.join(evaluationFolder, 'data.dataset.json')
		const fileContent = await Fs.promises.readFile(filePath, 'utf8')
		const datasetJson = /** @type {import("./type.d").DatasetJson} */(Json5.parse(fileContent))
		return datasetJson
	}

	/**
	 * 
	 * @param {string} evaluationName 
	 * @param {import("./type.d").DatasetJson} evaluationJson
	 */
	static async saveDatasetJson(evaluationName, evaluationJson) {
		const evaluationFolder = Utils.getEvaluationFolder(evaluationName)
		await FsExtra.ensureDir(evaluationFolder)
		const filePath = Path.join(evaluationFolder, 'data.dataset.json')
		const fileContent = JSON.stringify(evaluationJson, null, '\t')
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
		const predictionJson = /** @type {import("./type.d").EvaluationJson} */(Json5.parse(fileContent))
		return predictionJson
	}

	/**
	 * 
	 * @param {string} evaluationName 
	 * @param {string} predictionName
	 * @param {import("./type.d").EvaluationJson} predictionJson
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
		const predictionJson = /** @type {import("./type.d").EvaluationJson} */(Json5.parse(fileContent))
		return predictionJson
	}


	/**
	 * 
	 * @param {string} evaluationName 
	 * @param {string} predictionName
	 * @param {import("./type.d").EvaluationJson} evaluationJson
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
	 * @param {import("./type.d").HyperParametersSearchPredictionJson} searchPredictionJson
	 */
	static async savePredictionMetadataJson(evaluationName, predictionName, searchPredictionJson) {
		const predictionFolder = Utils.getPredictionFolder(evaluationName, predictionName)
		await FsExtra.ensureDir(predictionFolder)
		const filePath = Path.join(predictionFolder, 'metadata.json')
		const fileContent = JSON.stringify(searchPredictionJson, null, '\t')
		await Fs.promises.writeFile(filePath, fileContent, 'utf8')
	}
}