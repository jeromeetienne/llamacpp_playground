# llama_playground
Playground using llama-cpp

## npm scripts

To install the project
```
npm install
```

To download a model from huggingface
```
npm run download:model
```

## Files
- ```examples/``` contains examples
- [examples/langchain-chat-bot.js](examples/langchain-chat-bot.js) is a chat bot using [langchain.js](https://js.langchain.com/) and the local model
- [examples/raw-chat-bot.js](examples/langchain-chat-bot.js) is a chat bot using [node-llama-cpp](https://withcatai.github.io/node-llama-cpp/) and the local model