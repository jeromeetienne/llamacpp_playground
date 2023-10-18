# Experimentation evaluating llamacpp

## Goals
- [ ] Compare the performance of llamacpp models
  - thus people can choose the best model for their use case
- [ ] do it with 2 technologies: natively node-llama-cpp and langchain.js
  - langchain.js support for llamacpp is not perfect, but it is so rich
- [ ] What are the limits of langchain.js's support for llamacpp

## Langchain.js support status
- langchain's LLamaCpp doesn't support grammar
  - the json grammar is a **KEY** feature of llamacpp, improving quality of structured output
  - **NOTE** Q. could we improve langchain support ? it got the concept in [DynamicStructuredTool](https://js.langchain.com/docs/modules/agents/agent_types/structured_chat)
- langchain's LLamaCpp doesn't support chat-model

## Evaluation Steps

When doing a evaluation, multiples steps are needed

### 1. generate dataset
Sometime it may be interesting to generate synthetic dataset to evaluate the model on. It is faster to build than manual dataset.
If your dataset is manual, you can skip this step.

```
node ./bin/dataset-evaluation.js generate myEval
```

**Available Options**
- ```-l``` or ```--langchain``` to use langchain.js
- ```-d``` or ```--direct``` to use node-llama-cpp
- ```-n``` or ```--nQuestions``` to specify the number of questions to generate

### 2. do a prediction on this dataset

```
node ./bin/dataset-evaluation.js predict myEval myPredict
```

- ```-l``` or ```--langchain``` to use langchain.js
- ```-d``` or ```--direct``` to use node-llama-cpp

TODO
- specify the model, systemPrompt, userPrompt

### 3. evaluate this prediction

```sh
node ./bin/dataset-evaluation.js evaluate myEval myPredict
```


### 4. display a report comparing all predictions

```sh
node ./bin/dataset-evaluation.js report myEval
```

## How to do hyper parameter tuning

All the evaluation steps can be a drag to do manually. So we can use the hyper parameter tuning feature to do it for us.

```sh
node ./bin/dataset-evaluation.js hptuning myEval ./data/evaluations/hptunings/superHpTuning.hptuning.json5
```

- [Sample .hptuning.json5 file](./data/evaluations/hptunings/superHpTuning.hptuning.json5)