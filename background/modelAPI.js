globalThis.queryChatAPI = async function(data, conversationSettings) {
    const [provider, model] = conversationSettings.model.split(':')
    const apiKeyName = 'key_' + provider;
    let apiKey = await chrome.storage.local.get(apiKeyName)
    if(!Object.keys(apiKey).includes(apiKeyName)) return {error: 'API key not found for ' + provider + '. Please provide an API Key in the extension\'s settings.'};
    apiKey = apiKey[apiKeyName];
    if(provider === 'HuggingFace') {
        return queryHuggingface(data, conversationSettings, model, apiKey);
    }else if(provider === 'OpenAI') {
        return queryOpenAI(data, conversationSettings, model, apiKey);
    }
}

globalThis.queryHuggingface = async function(data,conversationSettings, model, apiKey) {
    let request = {
        'inputs': data,
        'parameters': {
            'return_full_text': false,
            'num_return_sequences': conversationSettings.showChoice ? 3 : 1
        },
        'options':{
            'use_cache': false,
            'wait_for_model	': true,
        }
    };
    if(conversationSettings.memberAnswers){
        request.parameters['max_new_tokens'] =  250;
    }

    const response = await fetch(
        'https://api-inference.huggingface.co/models/' + model,
        {
            headers: { Authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
            method: 'POST',
            body: JSON.stringify(request),
        }
    );
    const answers = await response.json();
    let result = []
    if(!answers.error && Array.isArray(answers) && answers.length > 0) {
        for(let answer of answers){
            result.push(answer.generated_text);
        }
    }else if(answers.error) {
        result = answers;
    }else{
        result.error = 'No answers';
    }
    return result;
}
globalThis.queryOpenAI = async function(data, conversationSettings, model, apiKey) {
    let isChat = false;
    if(model.startsWith('chat/')){
        model = model.substring(5);
        isChat = true;
    }
    let request = {
        'model': model,
        'temperature': 0.7,
        'n': conversationSettings.showChoice ? 3 : 1
    }
    if(isChat){
        request.messages = [{'role': 'user', 'content': data}]
    }else{
        request.prompt = data;
    }
    if(!conversationSettings.memberAnswers){
        request.stop = ['\n', '[']
    }

    const response = await fetch(
        'https://api.openai.com/v1' + (isChat ? '/chat' : '') + '/completions',
        {
            headers: { Authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
            method: 'POST',
            body: JSON.stringify(request),
        }
    );
    var answers = await response.json();
    let result = []
    if (!answers.error && Array.isArray(answers.choices) && answers.choices.length) {
        for(let answer of answers.choices){
            if(isChat){
                result.push(answer.message.content);
            }else{
                result.push(answer.text);
            }
        }
    } else if(answers.error){
        result = {error: answers.error.message};
    } else {
        result = {error: 'No answers'};
    }
    return result;
}
