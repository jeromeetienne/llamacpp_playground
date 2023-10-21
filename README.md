# llama_playground
Playground using llama-cpp

It contains experimentations on how to run local models using 
[llama-cpp library](https://github.com/ggerganov/llama.cpp) to run local models.
Here are the 
[supported models](https://github.com/ggerganov/llama.cpp#description).
We use it thru [node-llama-cpp wrapper](https://withcatai.github.io/node-llama-cpp/).

## npm scripts

To install the project
```
npm install
```

To download a model from huggingface
```
npm run download:mistral-7b-instruct
```

it will be downloaded in [./models/ folder](./models/).

### Benchmark
It will benchmark the downloaded models.

```sh
npm run benchmark
```

Output:
```
Benching model... codellama-7b-instruct.Q4_K_M.gguf
Time elapsed: 21.71-seconds
Speed: 108.75 chars/second - 25.01 tokens/second
Benching model... llama-2-7b-chat.Q6_K.gguf
Time elapsed: 22.05-seconds
Speed: 83.73 chars/second - 18.82 tokens/second
Benching model... mistral-7b-instruct-v0.1.Q6_K.gguf
Time elapsed: 20.07-seconds
Speed: 71.05 chars/second - 17.19 tokens/second
Benching model... zephyr-7b-alpha.Q6_K.gguf
Time elapsed: 14.41-seconds
Speed: 75.00 chars/second - 16.65 tokens/second
```

### Some Predefined Models For Convenience
Check the [./packages.json](./package.json) scripts and look at ```downdload:*``` or ```validate:*```.

To download a specific model
```sh
npm run download:mistral-7b-instruct
```

To check the download was successful
```sh
npm run validate:mistral-7b-instruct
```

## Useful Links
- node-llama-cpp doc https://withcatai.github.io/node-llama-cpp/guide/
- model to download https://huggingface.co/TheBloke/llama-2-7B-Arguments-GGUF
- langchain official doc https://js.langchain.com/docs/modules/model_io/models/llms/integrations/llama_cpp

## Models
The models are in GGUF format. They are downloaded from huggingface.
- https://huggingface.co/TheBloke/CodeLlama-13B-Instruct-GGUF
- https://huggingface.co/TheBloke/CodeLlama-7B-Instruct-GGUF
- https://huggingface.co/TheBloke/llama-2-7B-Arguments-GGUF

## Files
- ```examples/``` contains examples
- [examples/langchain-chat-bot.js](examples/langchain-chat-bot.js) is a chat bot using [langchain.js](https://js.langchain.com/) and the local model
- [examples/raw-chat-bot.js](examples/langchain-chat-bot.js) is a chat bot using [node-llama-cpp](https://withcatai.github.io/node-llama-cpp/) and the local model