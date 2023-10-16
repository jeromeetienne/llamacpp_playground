// node imports
import Path from "path";
import Fs from 'fs'

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

	static async loadText(contextLineLimit = 10) {
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
	 * @param {string} datasetName 
	 */
	static getEvaluationFolder(datasetName) {
		const evaluationFolder = Path.join(__dirname, `../data/evaluations/evaluation-${datasetName}`)
		return evaluationFolder
	}

	/**
	 * 
	 * @param {string} evaluationName 
	 */
	static async loadDatasetJson(evaluationName) {
		const evaluationFolder = Utils.getEvaluationFolder(evaluationName)
		const filePath = Path.join(evaluationFolder, 'data.dataset.json')
		const fileContent = await Fs.promises.readFile(filePath, 'utf8')
		const datasetJson = /** @type {import("./type.d").DatasetArrayJson} */(Json5.parse(fileContent))
		return datasetJson
	}

	/**
	 * 
	 * @param {string} evaluationName 
	 */
	static async loadPredictionJson(evaluationName) {
		const evaluationFolder = Utils.getEvaluationFolder(evaluationName)
		const filePath = Path.join(evaluationFolder, 'data.prediction.json')
		const fileContent = await Fs.promises.readFile(filePath, 'utf8')
		const predictionJson = /** @type {import("./type.d").PredictionArrayJson} */(Json5.parse(fileContent))
		return predictionJson
	}

	/**
	 * 
	 * @param {string} evaluationName 
	 */
	static async loadEvaluationJson(evaluationName) {
		const evaluationFolder = Utils.getEvaluationFolder(evaluationName)
		const filePath = Path.join(evaluationFolder, 'data.evaluation.json')
		const fileContent = await Fs.promises.readFile(filePath, 'utf8')
		const predictionJson = /** @type {import("./type.d").EvaluationArrayJson} */(Json5.parse(fileContent))
		return predictionJson
	}
}