/**
 * @typedef {object} DatasetItemJson
 * @property {string} question
 * @property {string} trueAnswer
 */
void (0);

/**
 * @typedef {DatasetItemJson[]} DatasetJson
 */
void (0);

/**
 * @typedef {object} PredictionItemJson
 * @property {string} predictedAnswer
 */
void (0);


/**
 * @typedef {PredictionItemJson[]} EvaluationJson
 */
void (0);

/**
 * @typedef {object} EvaluationItemJson
 * @property {boolean} predictionValid
 */
void (0);


/**
 * @typedef {EvaluationItemJson[]} EvaluationJson
 */
void (0);


/**
 * @typedef {object} ReportItemJson
 * @property {string} question
 * @property {string} trueAnswer
 * @property {string} predictedAnswer
 * @property {boolean} predictionValid
 */
void (0);


/**
 * @typedef {ReportItemJson[]} ReportArrayJson
 */
void (0);

/**
 * @typedef {object} HyperParametersSearchPredictionJson
 * @property {string=} modelName
 * @property {string=} prompt
 */
void (0);

/**
 * @typedef {object} HyperParametersSearchJson
 * @property {string} evaluationName
 * @property {HyperParametersSearchPredictionJson[]} predictions
 */
void (0);

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default {}