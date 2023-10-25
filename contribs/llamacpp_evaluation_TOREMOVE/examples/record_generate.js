// npm imports
import Zod from "zod";

// local imports
import ModelPathContants from "../../../src/model_path_constants.js";
import RecordGenerateLlamaCpp from "../src/helpers_generation/record_generate_llamacpp.js";
import RecordGenerateLangchain from "../src/helpers_generation/record_generate_langchain.js";


// create record zod schema
const recordZodSchema = Zod.object({
        fullName: Zod.string().describe('the full name of a person mentioned in the context'),
        age: Zod.number().nullable().describe('the age of this person. null if not specified'),
        happyNess: Zod.number().nullable().describe('the sadness/happiness of this person. integer from 0 to 10 inclusive. null if not specified'),
})

// const recordZodSchema = Zod.object({
//         summary: Zod.string().describe('the summary of the context'),
// })

// load the context we want to use
const context = `hello my name is John, my last name is Doe. I am 30 years old.
my friend is called Jane, her last name is Smith. she is 25 years old and not happy.
the other day, i met Bill Gates, he was laughing.`


// generate the records
let recordsJson = /** @type {array} */([])
const useLlamaCpp = true
if (useLlamaCpp) {
        recordsJson = await RecordGenerateLlamaCpp.generateRecordsFromZod(recordZodSchema, {
                recordCount: 0,
                context: context,
                // modelName: ModelPathContants.LLAMA_2_13B_CHAT_Q3_K_M,
        })
} else {
        recordsJson = await RecordGenerateLangchain.generateRecordsFromZod(recordZodSchema, {
                recordCount: 0,
                context: context,
                modelName: 'gpt-3.5-turbo',
        })
}

// display the records
console.log({ recordsJson })