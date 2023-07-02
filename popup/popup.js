import '../utils/anonymization.js';
// Handle the selected options
document.addEventListener('DOMContentLoaded', async function() {
    // Settings for
    let settingsTitleSpan = document.getElementById('settingsTitleSpan');
    let providerSelect = document.getElementById('providerSelect');
    let chatSelect = document.getElementById('chatSelect');
    let chatSettingsLabel = document.getElementById('chatSettingsLabel');
    let providerChoice = document.getElementById('providerChoice');
    let restartButton = document.getElementById('restartButton');
    let clearStorageButton = document.getElementById('clearStorageButton');
    let clearCacheButton = document.getElementById('clearCacheButton');

    // Members
    let membersSettingChatType = document.getElementById('membersSettingChatType');
    let membersSettingChatMembers = document.getElementById('membersSettingChatMembers');
    let memberSelect = document.getElementById('memberSelect');
    let memberInfo = document.getElementById('memberInfo');
    let memberInfoAddButton = document.getElementById('memberInfoAddButton');
    let memberInfoSaveButton = document.getElementById('memberInfoSaveButton');
    let memberInfoDiscardButton = document.getElementById('memberInfoDiscardButton');
    // Model
    let modelSelect = document.getElementById('modelSelect');
    let modelProviderLabelSelector = '.modelProviderLabel';
    let modelProviderKey = document.getElementById('modelProviderKey');
    let modelProviderkeySetButton = document.getElementById('modelProviderkeySetButton');
    let modelProviderkeyForgetButton = document.getElementById('modelProviderkeyForgetButton');
    
    //  Answer quality
    let answerSelect = document.getElementById('answerSelect');
    let memberAnswerCheckbox = document.getElementById('memberAnswerCheckbox');
    let showChoiceCheckbox = document.getElementById('showChoiceCheckbox');
    // Language
    let languageSelect = document.getElementById('languageSelect');
    // Pre-Prompt
    let chatPrompt = document.getElementById('chatPrompt');
    let chatPromptCompiledPanel = document.getElementById('chatPromptCompiledPanel');
    let chatPromptCompiled = document.getElementById('chatPromptCompiled');
    let compilePromptButton = document.getElementById('compilePromptButton');
    let resetTooltipLanguage = document.getElementById('resetTooltipLanguage');
    let resetPromptButton = document.getElementById('resetPromptButton');
    let copyPromptButtons = document.querySelectorAll('[data-copy-prompt]');
    let fullCompiledPrompt = document.getElementById('fullCompiledPrompt');

    for(let openExtensionWebsite of document.querySelectorAll('[data-open-extension-site]')) {
        openExtensionWebsite.addEventListener('click', function(e){
            e.preventDefault();
            chrome.tabs.create({url: chrome.runtime.getURL('/popup/manual.html')});
        });
    }

    let anonymizer;


    function getLanguage() {
        let locales = languageSelect.value;
        if (!locales) locales = 'en-us'
        return locales;
    }

    async function onLanguageChange(){
        let locales = getLanguage();
        anonymizer = await new Promise((resolve) => {
            new Anonymization(locales, (anonymization) => {
                resolve(anonymization)
            })
        })
        // resetTooltipLanguage.innerText = locales;
        resetTooltipLanguage.innerText = "Language: " + locales.split("-").join(" - Country: ");
    }
    // load saved settings

    let cache = await chrome.storage.local.get('settings');
    let settings = cache.settings ? cache.settings : {};
    if(!cache.settings) {
        saveAllSettings();
    }
    await loadSettings();

    function onRestartButtonClicked(){
        if(restartButton.hasAttribute('data-confirm')){
            chrome.runtime.reload();
        } else {
            restartButton.setAttribute('data-confirm', 'true');
            restartButton.innerHTML = '&#x1F50C; Click again to restart';
            setTimeout(function(){
                restartButton.removeAttribute('data-confirm');
                restartButton.innerHTML = '&#x1F50C; Restart';
            }, 2000)
        }
    }
    function onClearStorageButtonClicked(){
        function resetButton(){
            clearStorageButton.removeAttribute('data-confirm');
            clearStorageButton.innerHTML = '&#x274C;&#x1F4BE; Clear storage';
        }
        if(clearStorageButton.hasAttribute('data-confirm')) {
            chrome.storage.local.clear();
            resetButton()
        } else {
            clearStorageButton.setAttribute('data-confirm', 'true');
            clearStorageButton.innerHTML = '&#x274C;&#x1F4BE; Click again to clear storage';
            setTimeout(resetButton, 2000)
        }
    }
    function onClearCacheButtonClicked(){
        async function clearCache(){
            let allStorage = await chrome.storage.local.get();
            for(let key of Object.keys(allStorage)){
                let needUpdate = false;
                if(allStorage[key].chatList){
                    for(let chatId of Object.keys(allStorage[key].chatList)){
                        allStorage[key].chatList[chatId].chat = [];
                        needUpdate = true;
                    }
                }
                if(needUpdate){
                    let updated = {}
                    updated[key] = allStorage[key];
                    await chrome.storage.local.set(updated);
                }
            }

        }
        function resetButton(){
            clearCacheButton.removeAttribute('data-confirm');
            clearCacheButton.innerText = 'Clear cache';
        }
        if(clearCacheButton.hasAttribute('data-confirm')) {
            clearCache().then(()=>{
                resetButton()
            })
        } else {
            clearCacheButton.setAttribute('data-confirm', 'true');
            clearCacheButton.innerText = 'Click again to clear cache';
            setTimeout(resetButton, 2000)
        }
    }

    function setSetting(key, value){
        let providerOption = providerSelect.value;
        let chatOption = chatSelect.value;
        if(providerOption === 'any') {
            settings[key] = value;
        }else{
            if(!Object.keys(settings).includes(providerOption)) settings[providerOption] = {}
            if(chatOption === 'any'){
                settings[providerOption][key] = value;
            }else{
                if(!Object.keys(settings[providerOption]).includes(chatOption)) settings[providerOption][chatOption] = {}
                settings[providerOption][chatOption][key] = value;
            }
        }
        saveSettings();
    }
    function saveSettings() {
        chrome.storage.local.set({settings: settings});
    }
    function loadSetting(key, loader){
        let providerOption = providerSelect.value;
        let chatOption = chatSelect.value;
        let value = settings[key];
        let givenProvider = providerOption !== 'any';
        let givenChat = chatOption !== 'any';
        if(givenProvider) {
            if(givenChat){
                if(Object.keys(settings).includes(providerOption)){
                    if(Object.keys(settings[providerOption]).includes(chatOption) && Object.keys(settings[providerOption][chatOption]).includes(key)){
                        value = settings[providerOption][chatOption][key]
                    }else if(Object.keys(settings[providerOption]).includes(key)){
                        value = settings[providerOption][key]
                    }
                }
            }else{
                if(Object.keys(settings).includes(providerOption) && Object.keys(settings[providerOption]).includes(key)){
                    value = settings[providerOption][key]
                }
            }
        }
        loader(value);
    }
    async function loadSettings(){
        cache = await chrome.storage.local.get('settings');
        settings = cache.settings ? cache.settings : {};
        loadSetting('model', (value) => modelSelect.value = value);
        loadSetting('answer', (value) => answerSelect.value = value);
        loadSetting('memberAnswers', (value) => memberAnswerCheckbox.checked = value);
        loadSetting('showChoice', (value) => showChoiceCheckbox.checked = value);
        loadSetting('language', (value) => languageSelect.value = value);
        loadSetting('prePromptText', (value) => chatPrompt.value = value);
        await onLanguageChange();
    }
    function saveAllSettings() {
        setSetting('model', modelSelect.value);
        setSetting('answer', answerSelect.value);
        setSetting('memberAnswers', memberAnswerCheckbox.checked);
        setSetting('showChoice', showChoiceCheckbox.checked);
        setSetting('language', languageSelect.value);
        setSetting('prePromptText', chatPrompt.value);
    }

    function resetPrompt(){
        let providerOption = providerSelect.value;
        let chatOption = chatSelect.value;
        let locales = getLanguage()
        function callback(prePrompt){
            console.log('Private Parrot::content.js: prePrompt from storage: ', prePrompt);
            chatPrompt.value = prePrompt;
            setSetting('prePromptText', prePrompt);
        }
        new Anonymization(locales, (anonymizer) => {
            if(providerOption !== 'any' && chatOption !== 'any'){
                chrome.storage.local.get(providerOption).then((conversationCache) => {
                    const chatList = conversationCache[providerOption].chatList;
                    let chat = chatList[chatOption];
                    anonymizer.getDefaultPrePrompt(chat).then(callback)
                });
            }else{
                anonymizer.getDefaultPrePrompt().then(callback)
            }
        })
    }
    function resizeTextarea() {
        chatPrompt.style.height = '';
        chatPrompt.style.height = (chatPrompt.scrollHeight + 10) + 'px';
    }

    resizeTextarea();
    restartButton.addEventListener('click', onRestartButtonClicked)
    clearStorageButton.addEventListener('click', onClearStorageButtonClicked)
    clearCacheButton.addEventListener('click', onClearCacheButtonClicked)

    function getProviderAPIKey(provider) {
        return 'key_' + provider;
    }

    function onModelChange() {
        document.querySelectorAll(modelProviderLabelSelector).forEach(function(element) {element.innerText = '';})
        const model = modelSelect.value;
        const provider = model.split(':')[0];
        document.querySelectorAll(modelProviderLabelSelector).forEach(function(element) {element.innerText = provider;})
        chrome.storage.local.get(getProviderAPIKey(provider)).then((key) => {
            let hasKey = Object.keys(key).includes(getProviderAPIKey(provider));
            let buttonVisible = modelProviderkeyForgetButton.style.display === '';
            if(hasKey && !buttonVisible){
                modelProviderkeyForgetButton.style.display = '';
            }else if(!hasKey && buttonVisible){
                modelProviderkeyForgetButton.style.display = 'none';
            }
        })
    }
    function onModelSetKey(){
        const key = modelProviderKey.value;
        const model = modelSelect.value;
        const provider = model.split(':')[0];
        let keySetting = {}
        keySetting[getProviderAPIKey(provider)] = key;
        chrome.storage.local.set(keySetting).then(() => {
            modelProviderkeyForgetButton.style.display = '';
            modelProviderKey.value = '';
        });
    }
    function onModelForgetKey(){
        const model = modelSelect.value;
        const provider = model.split(':')[0];
        chrome.storage.local.remove(getProviderAPIKey(provider)).then(() => {
            modelProviderkeyForgetButton.style.display = 'none';
        });
    }
    onModelChange();

    modelSelect.addEventListener('change', function() {
        setSetting('model', modelSelect.value);
        onModelChange();
    });
    modelProviderkeySetButton.addEventListener('click', onModelSetKey)
    modelProviderkeyForgetButton.addEventListener('click', onModelForgetKey)
    answerSelect.addEventListener('change', function() {
        setSetting('answer', answerSelect.value);
    });
    memberAnswerCheckbox.addEventListener('change', function() {
        setSetting('memberAnswers', memberAnswerCheckbox.checked);
    })
    showChoiceCheckbox.addEventListener('change', function() {
        setSetting('showChoice', showChoiceCheckbox.checked);
    })
    languageSelect.addEventListener('change', function() {
        setSetting('language', languageSelect.value);
        onLanguageChange();
    })
    chatPrompt.addEventListener('input', function() {
        setSetting('prePromptText', chatPrompt.value);
        resizeTextarea();
    })
    compilePromptButton.addEventListener('click', showCompiledChat)
    resetPromptButton.addEventListener('click', resetPrompt)
    copyPromptButtons.forEach((copyPromptButton) => copyPromptButton.addEventListener('click', function () {
        fullCompiledPrompt.select();
        fullCompiledPrompt.setSelectionRange(0, 99999); // For mobile devices
        navigator.clipboard.writeText(fullCompiledPrompt.value);
    }));
    function showCompiledChat(){
        hideCompiledChat();
        let providerOption = providerSelect.value;
        let chatOption = chatSelect.value;
        chatPromptCompiled.innerHTML = ''

        function buildReplacementTag(originalElement, originalText, replacedElement, replacementText, icon='&#x1F575;', inline=true) {
            originalElement.innerText = originalText;
            originalElement.style.display = 'none'
            replacedElement.innerHTML =  icon + ' ' + replacementText;
            const onEnter = function () {
                originalElement.style.display = inline ? 'inline-block' : '';
            };
            const onLeave = function () {
                originalElement.style.display = 'none';
            };
            replacedElement.addEventListener('mouseenter', onEnter)
            replacedElement.addEventListener('mouseleave', onLeave)
            originalElement.addEventListener('mouseenter', onEnter)
            originalElement.addEventListener('mouseleave', onLeave)
            replacedElement.className = 'chat-message-anonymized' + (inline ? ' inline-block' : '');
            originalElement.className = 'chat-message-anonymized-original' + (inline ? ' inline-block' : '');
        }

        function buildContentReplacedPanel(replacements, content, icon='&#x1F575;', inline=true) {
            let chatConversationMessageText = document.createElement('span');
            const replacementsLength = replacements.length;
            if (replacementsLength > 0) {
                if (replacements[0].start !== -1 && replacements[0].end !== content.length - 1) {
                    chatConversationMessageText.prepend(document.createTextNode(content.substring(replacements[0].end, content.length)));
                }
                let lastReplacement = null;
                for (let replacement of replacements) {
                    if (replacement.start !== -1){
                        if (lastReplacement !== null) {
                            if (lastReplacement.start !== replacement.end) {
                                chatConversationMessageText.prepend(document.createTextNode(content.substring(replacement.end, lastReplacement.start)));
                            }
                        }
                        let originalElement = document.createElement('span');
                        let replacedElement = document.createElement('span');

                        buildReplacementTag(originalElement, replacement.original, replacedElement, replacement.replacement, icon, inline);
                        chatConversationMessageText.prepend(originalElement, replacedElement)
                        lastReplacement = replacement;
                    }
                }
                if (replacements[replacementsLength - 1].start > 0) {
                    chatConversationMessageText.prepend(document.createTextNode(content.substring(0, replacements[replacementsLength - 1].start)));
                }
            } else {
                chatConversationMessageText.innerText = content;
            }
            chatConversationMessageText.className = 'chat-message-text';
            return chatConversationMessageText;
        }

        function buildChatConversationMessagePanel(chatMessage) {
            let chatConversationMessagePanel = document.createElement('div');
            chatConversationMessagePanel.className = 'chat-message-panel';
            let chatConversationMessageDate = document.createElement('div');
            let chatConversationMessageSenderOriginal = document.createElement('span');
            let chatConversationMessageSender = document.createElement('span');
            let chatConversationContentSeparator = document.createElement('span');
            let chatMessagePin = document.createElement('div')
            chatConversationMessageDate.innerText = chatMessage.date;
            if (chatMessage.originalSenderId !== selfId) {
                chatMessagePin.className = 'chat-message-pin-left';
                buildReplacementTag(chatConversationMessageSenderOriginal, chatMessage.originalSender, chatConversationMessageSender, chatMessage.sender);
            } else {
                chatMessagePin.className = 'chat-message-pin-right';
                chatConversationMessageSender.innerHTML = chatMessage.sender;
            }
            chatConversationContentSeparator.innerText = ':';
            let chatConversationMessageText = buildContentReplacedPanel(chatMessage.replacements, chatMessage.message);
            chatConversationMessageDate.className = 'chat-message-date';
            chatMessagePin.className += ' chat-message-pin';
            chatConversationMessagePanel.append(chatMessagePin);
            chatConversationMessagePanel.append(chatConversationMessageDate);
            if (chatMessage.originalSenderId !== selfId) {
                chatConversationMessagePanel.append(chatConversationMessageSenderOriginal);
            }
            chatConversationMessagePanel.append(chatConversationMessageSender, chatConversationContentSeparator, chatConversationMessageText);
            return chatConversationMessagePanel;
        }

        chrome.runtime.sendMessage({ generateChat: true, message: '', provider: providerOption, chat: chatOption }, function callback(response){
            console.log('Private Parrot::content.js: Message  generated chat from background: ', response);
            if(!response || !response.conversation || !response.compiled || !Array.isArray(response.conversation) || response.conversation.length !== 3) {
                return
            }
            fullCompiledPrompt.value = response.compiled;
            let [prePrompt, chatConversation, postPrompt] = response.conversation;
            let prePromptPanel = buildContentReplacedPanel(prePrompt.replacements, prePrompt.compiled, '&#x1F4E6;', false);
            prePromptPanel.className = 'pre-prompt-panel';
            let chatConversationPanel = document.createElement('div');
            chatConversationPanel.className = 'chat-conversation-panel';
            for(let chatMessage of chatConversation){
                chatConversationPanel.append(buildChatConversationMessagePanel(chatMessage));
            }
            let postPromptPanel = document.createElement('div');
            postPromptPanel.className = 'post-prompt-panel';
            postPromptPanel.append(buildChatConversationMessagePanel(postPrompt))
            chatPromptCompiled.append(prePromptPanel, chatConversationPanel, postPromptPanel);
            chatPromptCompiledPanel.style.display = '';
        });
    }
    function hideCompiledChat(){
        chatPromptCompiledPanel.style.display = 'none';
        chatPromptCompiled.innerText = '';
    }
    function onMemberSelectChange() {
        let providerOption = providerSelect.value;
        let chatOption = chatSelect.value;
        let selectedMember = memberSelect.value;
        function createMemberDataRow(id, key, values){
            let row = document.createElement('div');
            row.className = 'row'
            let keyCol = document.createElement('div');
            keyCol.className = 'col';

            let categorySelect = document.createElement('select');
            let replacements = anonymizer.getReplacements();
            let replacementKeys = Object.keys(replacements);
            for(let replacementKey of replacementKeys){
                let option = document.createElement('option');
                option.value = replacementKey;
                if(replacementKey === key){
                    option.selected = true;
                }
                option.innerText = replacements[replacementKey].value;
                categorySelect.appendChild(option);
            }
            categorySelect.setAttribute('data-key', '');
            let valueCol = document.createElement('div');
            valueCol.className = 'col';

            let tagArea = document.createElement('div');
            tagArea.className = 'tag-area';
            tagArea.setAttribute('data-value', '')
            let ul = document.createElement('ul');
            let tagInput = document.createElement('input');
            tagInput.type = 'text';
            tagInput.className = 'tag-input'
            tagInput.setAttribute('id', id);
            ul.append(tagInput)
            tagArea.append(ul)
            if(key && values) {
                categorySelect.setAttribute('data-initial-key', key);
                tagArea.setAttribute('data-initial-value', JSON.stringify(values));
            }
            keyCol.appendChild(categorySelect);
            row.appendChild(keyCol);
            valueCol.appendChild(tagArea);
            row.appendChild(valueCol);
            return row;
        }

        chrome.storage.local.get(providerOption).then((conversationCache) => {
            memberInfo.querySelectorAll('.row').forEach((element) => element.remove());
            if(!conversationCache[providerOption].contactList[selectedMember]) return;
            let selectedMemberInfo = conversationCache[providerOption].contactList[selectedMember].anonymizationMap;
            for(let key of Object.keys(selectedMemberInfo)) {
                let values = selectedMemberInfo[key];
                let newId = getUniqueId('member_value_new');

                const memberInfoValueId = getUniqueId('member_value_' + key);
                let row = createMemberDataRow(memberInfoValueId, key, values) ;
                memberInfo.querySelector('.footer').before(row);
                let tagBox = new TagBox(memberInfoValueId)
                tagBox.addTags(...values);
            }

            function getUniqueId(idPrefix) {
                let newId = idPrefix
                let sequence = 0;
                while (document.getElementById(newId)) {
                    sequence++;
                    newId = idPrefix + sequence;
                }
                return newId;
            }

            memberInfoAddButton.addEventListener('click', function() {
                let newId = getUniqueId('member_value_new');
                let row = createMemberDataRow(newId);
                memberInfo.querySelector('.footer').before(row);
                new TagBox(newId);
            })
            memberInfoSaveButton.addEventListener('click', function() {
                let updatedMembers = false;
                let removeKeys = Object.keys(selectedMemberInfo);
                memberInfo.querySelectorAll('.row').forEach((rowDiv) => {
                    let valueInput = rowDiv.querySelector('div[data-value]');
                    let valueTags = Array.from(valueInput.querySelectorAll('li.tag'));
                    let categorySelect = rowDiv.querySelector('select[data-key]');
                    let key = categorySelect.value;
                    let values = valueTags.map((element) => element.innerText);
                    let indexToRemove = removeKeys.indexOf(key);
                    if(indexToRemove !== -1) removeKeys.splice(indexToRemove, 1);
                    if(key && Array.isArray(values) && values.length > 0) {
                        selectedMemberInfo[key] = []
                        for(let value of values){
                            selectedMemberInfo[key].push(value);
                        }
                        updatedMembers = true;
                        valueInput.setAttribute('data-initial-value', JSON.stringify(values));
                        categorySelect.setAttribute('data-initial-key', key);
                    }else{
                        rowDiv.remove();
                    }
                });
                for(let keyToRemove of removeKeys){
                    delete selectedMemberInfo[keyToRemove];
                }
                if(updatedMembers) {
                    chrome.storage.local.set(conversationCache, () => console.log('Members updated'));
                }
            })
            memberInfoDiscardButton.addEventListener('click', function() {
                memberInfo.querySelectorAll('.row').forEach((rowDiv) => {
                    let initialValueInput = rowDiv.querySelector('div[data-initial-value]');
                    let initialCategorySelect = rowDiv.querySelector('select[data-initial-key]');
                    if(initialValueInput && initialCategorySelect){
                        let values = JSON.parse(initialValueInput.getAttribute('data-initial-value'));
                        let tagBox = new TagBox(rowDiv.querySelector('input.tag-input').id);
                        tagBox.addTags(...values);
                        initialCategorySelect.value = initialCategorySelect.getAttribute('data-initial-key');
                    }else{
                        rowDiv.remove()
                    }
                });
            })
        });

    }
    function onChatSelectChange() {
        let providerOption = providerSelect.value;
        let chatOption = chatSelect.value;
        if(chatOption === 'any') {
            document.querySelectorAll('.member-settings-show').forEach((element) => element.style.display = 'none');
            document.querySelectorAll('.member-settings-hide').forEach((element) => element.style.display = '');
            memberSelect.removeEventListener('change', onMemberSelectChange)
            if(providerOption !== 'any') settingsTitleSpan.innerText = 'for ' + providerOption.substring(0,1).toUpperCase() + providerOption.substring(1);
            hideCompiledChat();
        } else {
            document.querySelectorAll('.member-settings-show').forEach((element) => element.style.display = '');
            document.querySelectorAll('.member-settings-hide').forEach((element) => element.style.display = 'none');
            memberSelect.innerHTML = ''
            chrome.storage.local.get(providerOption).then((conversationCache) => {
                const chatList = conversationCache[providerOption].chatList;
                let selectedChat = chatList[chatOption];
                let contactList = conversationCache[providerOption].contactList;
                membersSettingChatType.innerText = selectedChat.type ? 'Chat  type: ' + selectedChat.type : '';
                membersSettingChatMembers.innerText = selectedChat.numberOfMembers ? 'Chat members: ' + selectedChat.numberOfMembers : '';
                let members = Anonymization.getMembers(selectedChat, contactList);
                for( let memberID of members){
                    let name =  contactList[memberID] ? contactList[memberID].name : 'Anonymous';
                    let option = document.createElement('option');
                    option.value = memberID;
                    option.innerText = name;
                    memberSelect.appendChild(option);
                }
                memberSelect.addEventListener('change', onMemberSelectChange);
                onMemberSelectChange()
                settingsTitleSpan.innerText = 'for ' + providerOption.substring(0,1).toUpperCase() + providerOption.substring(1) + ' > ' +  chatList[chatOption].name;

            });
            showCompiledChat()
        }
        loadSettings().then()
    }
    function onProviderSelectChange() {
        let providerOption = providerSelect.value;
        if(providerOption !== 'any'){
            settingsTitleSpan.innerText = 'for ' + providerOption.substring(0,1).toUpperCase() + providerOption.substring(1);
            providerChoice.innerText = providerOption;
            chatSelect.style.display = '';
            chatSelect.innerHTML = '';
            chatSettingsLabel.style.display = '';
            chrome.storage.local.get(providerOption).then((conversationCache) => {
                let anyOption = document.createElement('option');
                anyOption.value = 'any';
                anyOption.innerText = 'All chats';
                chatSelect.appendChild(anyOption);
                if(conversationCache[providerOption]){
                    let chatList = Object.keys(conversationCache[providerOption].chatList);
                    chatList.forEach((chat) => {
                        let option = document.createElement('option');
                        option.value = chat;
                        option.innerText = conversationCache[providerOption].chatList[chat].name;
                        chatSelect.appendChild(option);
                    });
                }
                chatSelect.addEventListener('change', onChatSelectChange);
                chatSelect.value = anyOption.value;

            })
        }else{
            settingsTitleSpan.innerText = '';
            chatSelect.value = 'any'
            onChatSelectChange();
            chatSelect.innerHTML = '';
            chatSelect.style.display = 'none';
            chatSelect.removeEventListener('change', onChatSelectChange);
            chatSettingsLabel.style.display = 'none';
        }
        loadSettings().then()
    }

    providerSelect.addEventListener('change', onProviderSelectChange);

    // resize (does not really work actually)
    let bodyStyleMap = window.getComputedStyle(document.body);
    let bodyHeight = window.innerHeight;
    let goldenRatio = 1.618033988749895;
    document.body.style.width = (Math.ceil(bodyHeight / goldenRatio) -  parseInt(bodyStyleMap.marginLeft) - parseInt(bodyStyleMap.marginRight))+ 'px';

});
