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
 * @typedef {PredictionItemJson[]} PredictionJson}
 */
void (0);

/**
 * @typedef {object} PredictionMetadataOptionsJson
 * @property {string=} modelName
 * @property {string=} prompt
 */
void (0);
/**
 * @typedef {object} PredictionMetadataJson
 * @property {PredictionMetadataOptionsJson} defaultPredictOptions
 * @property {PredictionMetadataOptionsJson} modifiedPredictOptions
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
 * @typedef {ReportItemJson[]} ReportJson
 */
void (0);

/**
 * @typedef {object} HpTuningPredictionJson
 * @property {string=} hpTuningName
 * @property {string=} modelName
 * @property {string=} prompt
 */
void (0);

/**
 * @typedef {object} HpTuningJson
 * @property {string} hpTuningName
 * @property {HpTuningPredictionJson[]} predictions
 */
void (0);

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

export default {}