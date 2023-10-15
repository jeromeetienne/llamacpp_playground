// node imports
import Path from "path";
import Fs from 'fs'

// npm imports
import CliColor from "cli-color";

// get __dirname in esm module
import Url from "url";
const __dirname = Path.dirname(Url.fileURLToPath(import.meta.url));

export default class Utils {
        static async loadText(contextLineLimit = 10) {
                const contextFileName = Path.join(__dirname, '../data/state_of_the_union.txt')
                const contextTextFull = await Fs.promises.readFile(contextFileName, 'utf8')
                const contextTextLines = contextTextFull.split('\n').map(line => line.trim()).filter(line => line.length > 0)
                // keep only the 200 first lines
                contextTextLines.splice(contextLineLimit)
                const contextText = contextTextLines.join('\n')
                return contextText
        }
}