

- [ ] should i put ```data.dataset.json``` into a ```./evaluations/datasets/``` folder
- what about ```./hptunings/``` + ```./datasets/``` => copy to ```./evaluation_${evaluationName}/```, then use it there
  - Q. should you add a specific command
  - then you perform a evaluation on it
  - you dont recompute all what has been computed already
  - you get hptuning.json5 for specific grid search, or for default options

- [ ] Find a better workflow (finer grained steps) for ```llamacpp_evaluation```
  - personality generate a .hptuning.json5 (and maybe .dataset.json)
  - .hptuning.json5 -> .prediction-metadata.json
  - **predict**: .prediction-metadata.json + .dataset.json -> .prediction.json
  - **evaluate**: .prediction.json -> .evaluation.json
- [ ] remove 'generate' from ```llamacpp_evaluation.js```
  - put it in ```hptuning-generator.js```
- [x] add dataset.json personality in ```hptuning-generator```
  - Q. should i rename it ```dataset-generator``` ?



- [x] write a generator who try to ignore the userprompt, on all the opensource model available
  - separate script to do it... call that the ```hptuning-generator``` with multiple **personality**.
  - each personality is a specific generator ... ```.hptuning.json5``` and ```.dataset.json``` may be generated
  - it will generate a .hptuning.json5 with a grid search on the prompt+model independantly of the userprompt
- [ ] add the json-schema everywhere
- [ ] put the huggingface_playground in its own repo too
- [ ] put llamacpp_evaluation in its own git, <- YES do it
  - how to import the llamacpp_playground ? can i make a seperate git for that ?
  - it is required for source and to download models
  - git submodule ? no crazy... well documented ?
    - not crazy because it is done only once on a not that important directory
    - doc here https://gist.github.com/gitaarik/8735255
- [ ] Find better ideas of evaluations
  - e.g. perform one prompt optimisation for a given model
  - e.g. perform one pick the best model for a prompt

## Done
- [x] support systemPrompt in _direct and in _langchain
  - **BUG** showhow it doesnt seems to react well
  - is that a bug, or me being crazy or a bug in the model ?
- [x] currenlty the context is hardcoded in the framework
  - fix that
- [x] download zephyr, llama-13b
  - DONE codellama-7b, llama-7b, codellama-7b, codellama-13b
- [x] in available_models, sort by model size
- [x] DONE update all the jsdoc, in prediction and hptuning
- [x] add npm scripts
- [x] add documentation on the steps
- [x] support predictionName in .hptuning.json5
- [x] rename prompt into userPrompt


---
# REFACTOR
- some abstractions are missing...
- hptuning got list of tuples: models, template for userPrompt and systemPrompt
  - each of them is an prediction
  - this should remains out of the context

- dataset question generation is very specific the bot personality - so command line action ```generate-question``` ?
  - it is that who will determine the context specific to the questions
  - should i add the context in ```.dataset.json``` ?

- an prediction needs systemPrompt, userPrompt, modelName
- rename that ```.prediction-plan.json``` ?


## Roadmap
- [ ] make ```DatasetPredictDirect``` and ```DatasetPredictLangChain``` to receive a parse ```DatasetJson```
  - this ```DatasetJson``` contains the **FINAL** ```systemPromt``` and ```userPrompt``` (no variables)

---


- dataset contains a list of systemPrompt and userPrompt
- both are generated from a 'prompt template'
  - 'prompt template' === f-string template and a list of values
  - without predefined keys ? several questions for a predictions ? and the context depends on the questions
  - unclear...
  - ```userInput``` from the suer
  - ```context```
  - ```responseFormatInstructions```
- hptuning is a list of models and a list of prompt template
  - then a grid search is performed

