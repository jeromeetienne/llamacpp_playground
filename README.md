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
npm run download:model
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