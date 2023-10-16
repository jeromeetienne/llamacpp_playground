// from https://js.langchain.com/docs/modules/model_io/models/llms/integrations/huggingface_inference


import { HuggingFaceInference } from "langchain/llms/hf";

const model = new HuggingFaceInference({
  model: "gpt2",
  apiKey: process.env.HUGGINGFACEHUB_API_KEY,
});
const res = await model.call("1 + 1 =");
console.log({ res });