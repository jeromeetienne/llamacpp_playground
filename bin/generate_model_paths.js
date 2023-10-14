// node imports
import Path from "path";
import Fs from 'fs'

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	jsdoc
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {object} ModelPathItem
 * @property {string} modelPathItem.basename
 * @property {string} modelPathItem.slugifiedName
 */
void (0)

/**
 * @typedef {ModelPathItem[]} ModelPathArray
 */
void (0)

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Build modelPathArray
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

const modelPathArray = /** @type {ModelPathArray} */ ([])
const modelsFolderName =Path.join(__dirname, '../models')
let modelBasenames = await Fs.promises.readdir(modelsFolderName)
modelBasenames = modelBasenames.filter(basename => basename.endsWith('.gguf'))
for(const modelBasename of modelBasenames){
        const slugifiedName = modelBasename
        .replace(/\.gguf/, '')
        .replace(/\./g, '_')
        .replace(/-/g, '_')
        .toUpperCase()
        // debugger
        const modelPathItem = {
                basename: modelBasename,
                slugifiedName: slugifiedName,
        }
        modelPathArray.push(modelPathItem)
}

// console.log({modelPathArray})


///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Build outputText
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

let outputText = `// Autogenerated by bin/generate_model_paths.js

export default class AvailableModelPaths {
`
for(const modelPathItem of modelPathArray){
        const {basename, slugifiedName} = modelPathItem
        outputText += `\tstatic ${slugifiedName} = '${basename}'\n`
}
outputText += `
}
`

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	output outputText
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

console.log(outputText)