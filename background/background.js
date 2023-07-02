import './modelAPI.js';
import '../utils/anonymization.js';
// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // Check the origin of the message
    if (sender.tab) {
        // Message from content script
        let conversationKey = null;
        if (sender.tab.url.includes('https://web.whatsapp.com/')) {
            // Perform actions for WhatsApp
            conversationKey = 'whatsapp';
        } else if (sender.tab.url.includes('https://web.telegram.org/')) {
            // Perform actions for Telegram
            conversationKey = 'telegram';
        }
        console.log('Private Parrot::background.js: Message from content script (' + conversationKey +'): ', message);
        if(message.contentScriptReady){
            chrome.storage.local.get(conversationKey).then((cache) => {
                console.log('Private Parrot::background.js: Loaded chat list', cache[conversationKey]);
                sendResponse(cache[conversationKey])
            });
            return true;
        } else if(message.webChat){
            let cache = {};
            cache[conversationKey] = message.webChat;
            console.log('Private Parrot::background.js: Saving ' + conversationKey + ' chat list: ', message.webChat);
            chrome.storage.local.set(cache, (webChat) => {
                console.log('Private Parrot::background.js: Saved chat list', webChat);
                sendResponse({ result: 'Success' });
            });
            return true;
        } else if(message.generateMessage){
            buildConversation(message).then((builtConversation) => {
                let conversation = builtConversation.compiled;
                console.log('Private Parrot::background.js: Message query: ', message);
                console.log('Private Parrot::background.js: Conversation: ', conversation);
                loadSettings(message.provider, message.chat).then((conversationSettings) => {

                    queryChatAPI(conversation, conversationSettings).then((response) => {
                        let cleanAnswers = [];
                        if(response.error) {
                            sendResponse(['Error: ' + response.error]);
                            return;
                        }
                        for (let generatedAnswer of response) {
                            console.log('Private Parrot::background.js: Message answer: ' , generatedAnswer);
                            let generatedLines = generatedAnswer.split('\n');
                            let cleanAnswer = ''
                            let stopRegex = /^\[.*\]?.*/;
                            for(let generatedLine of generatedLines){
                                if(stopRegex.test(generatedLine) && !conversationSettings.memberAnswers){
                                    break;
                                }
                                cleanAnswer += generatedLine + '\n';
                            }
                            cleanAnswer = cleanAnswer.substr(0,cleanAnswer.length - 1)

                            for(let key of Object.keys(builtConversation.anonymousMap)){
                                let value = builtConversation.anonymousMap[key]
                                if(cleanAnswer.includes(value) && key !== 'chatName'){
                                    cleanAnswer = cleanAnswer.replaceAll(value, key);
                                }
                            }
                            cleanAnswer = cleanAnswer.replaceAll('\\n','\n')
                            console.log('Private Parrot::background.js: Clean generated answer: ', cleanAnswer);
                            cleanAnswers.push(cleanAnswer);
                        }
                        sendResponse(cleanAnswers);

                    });
                });

            });
            return true;

        }

    } else {
         if(message.generateChat){
            buildConversation(message).then((builtConversation) => {
                sendResponse(builtConversation);
            });
            return true;
        }
    }
    return false;
});
async function loadChat(provider, chat){
    let cache = await chrome.storage.local.get(provider);
    return { chat: cache[provider]?.chatList[chat], contactList: cache[provider]?.contactList }
}
async function loadSettings(provider, chat){
    let cache = await chrome.storage.local.get('settings');
    let settings = cache.settings ? cache.settings : {};
    function loadSetting(key, loader){
        let value = settings[key];
        if(Object.keys(settings).includes(provider)){
            if(Object.keys(settings[provider]).includes(chat) && Object.keys(settings[provider][chat]).includes(key)){
                value = settings[provider][chat][key]
            }else if(Object.keys(settings[provider]).includes(key)){
                value = settings[provider][key]
            }
        }
        loader(value);
    }
    let conversationSettings = {};
    loadSetting('model', (model) => conversationSettings.model = model);
    loadSetting('answer', (answer) => conversationSettings.answer = answer);
    loadSetting('memberAnswers', (memberAnswers) => conversationSettings.memberAnswers = memberAnswers);
    loadSetting('showChoice', (showChoice) => conversationSettings.showChoice = showChoice);
    loadSetting('language', (language) => conversationSettings.language = language);
    loadSetting('prePromptText', (prePromptText) => conversationSettings.prePromptText = prePromptText);
    return conversationSettings;

}
async function buildConversation(message){
    let conversationText = [];
    let conversationSettings = await loadSettings(message.provider, message.chat);
    let {chat, contactList} = await loadChat(message.provider, message.chat)

    let locales = conversationSettings.language;
    if(!locales) locales = 'en-us'
    let anonymizer = await new Promise((resolve) => {
        new Anonymization(locales, (anonymization) => {
            resolve(anonymization)
        })
    })

    // pre prompt
    const prePrompt = await anonymizer.compilePrePrompt(conversationSettings, chat, contactList);
    conversationText.push(prePrompt)

    // chat conversation
    const chatConversation = await anonymizer.anonymizeChat(conversationSettings, chat, contactList);
    conversationText.push(chatConversation)

    // post prompt
    const postPrompt = await anonymizer.compilePostPrompt(message.message, chat, contactList);
    conversationText.push(postPrompt)

    const compiledChatConversation = chatConversation.map((chat) => chat.compiled).join('');
    let compiledConversation = [prePrompt.compiled, compiledChatConversation, postPrompt.compiled].join('');

    return {compiled: compiledConversation, conversation: conversationText, anonymousMap: anonymizer.map}
}