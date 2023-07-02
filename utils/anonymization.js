globalThis.selfId = '000000000';
globalThis.nonTextMessages = [
    '[voice message]',
    '[voice call]',
    '[image message]',
    '[animated sticker message]'
]
globalThis.Anonymization = class Anonymization {
    constructor(locales, onReady) {
        // console.log('Private Parrot::Anonymization.js: Anonymization constructor called')
        this.locales = locales
        this.replacements = {}
        this.map = {}
        this.load().then(function(){
            onReady(this)
        }.bind(this));
    }
    async load(){
        this.replacements = JSON.parse(await (await fetch(chrome.runtime.getURL('/utils/_locales/' + this.locales + '/' + this.locales + '.json'))).text())
        console.log('Private Parrot::Anonymization.js: Anonymization replacements loaded: ', this.replacements)
    }
    async loadReplacement(key){
        if(Object.keys(this.replacements).includes(key) && !Object.keys(this.replacements[key]).includes('content')){
            this.replacements[key].content =  JSON.parse(await (await fetch(chrome.runtime.getURL('/utils/_locales/' + this.locales + '/' + this.replacements[key].choice))).text())
            console.log('Private Parrot::Anonymization.js: Anonymization replacement loaded: ', this.replacements[key])
        }
    }
    async getDefaults(key){
        return JSON.parse(await (await fetch(chrome.runtime.getURL('/utils/_locales/' + this.locales + '/defaults/' + key + '.json'))).text());
    }
    getReplacements(){
        return this.replacements
    }

    async getDefaultPrePrompt(chat){
        let defaultPrePrompts = await this.getDefaults('prompt');
        return chat && chat.type === 'group' ? defaultPrePrompts.group : defaultPrePrompts.private
    }
    async getDefaultMeName(){
        const defaultPrePrompt = await this.getDefaults('prompt');
        return defaultPrePrompt.me
    }
    async compilePrePrompt(conversationSettings, chat, contactList, anonymize=true){
        let replacements = []
        let conversationText = conversationSettings.prePromptText;
        const defaultPrePrompt = await this.getDefaults('prompt');
        const defaultOr = defaultPrePrompt.or;
        const defaultNor = defaultPrePrompt.nor;
        const chatName = anonymize ? await this.anonymizeMessageSender(chat.id, chat, contactList) : contactList[chat.id].name;
        const chatNameMarker = '{chat_name}';
        replacements.push({
            original: chatNameMarker,
            replacement: chatName,
            start: conversationText.indexOf(chatNameMarker),
            end: conversationText.indexOf(chatNameMarker) + chatName.length
        })
        conversationText = conversationText.replaceAll(chatNameMarker,  chatName);
        const orNonTextMessagesMarker = '{or_non_text_messages}';
        const orNonTextMessageReplacement = nonTextMessages.join(' ' + defaultOr + ' ');
        replacements.push({
            original: orNonTextMessagesMarker,
            replacement: orNonTextMessageReplacement,
            start: conversationText.indexOf(orNonTextMessagesMarker),
            end: conversationText.indexOf(orNonTextMessagesMarker) + orNonTextMessageReplacement.length
        })
        conversationText = conversationText.replaceAll(orNonTextMessagesMarker, orNonTextMessageReplacement);
        const norNonTextMessagesMarker = '{nor_non_text_messages}';
        const norNonTextMessageReplacement = nonTextMessages.join(' ' + defaultNor + ' ');
        replacements.push({
            original: norNonTextMessagesMarker,
            replacement: norNonTextMessageReplacement,
            start: conversationText.indexOf(norNonTextMessagesMarker),
            end: conversationText.indexOf(norNonTextMessagesMarker) + norNonTextMessageReplacement.length
        })
        conversationText = conversationText.replaceAll(norNonTextMessagesMarker, norNonTextMessageReplacement);

        conversationText += '\n'
        return {
            compiled: conversationText,
            replacements: replacements.reverse(),
        }
    }
    async compilePostPrompt(message, chat, contactList){
        let nowDate = '[' + new Date().toLocaleString(this.locales) + ']';
        let meSender = await this.getDefaultMeName();
        let myContent = await this.anonymizeMessageContent(message, chat, contactList);
        return {
            compiled: nowDate + ' ' + meSender + ': ' + myContent.message,
            date: nowDate,
            sender: meSender,
            message: myContent.message,
            replacements: myContent.replacements,
            originalMessage: message,
            originalSender: meSender,
            originalSenderId: selfId
        };
    }
    async anonymizeMessage(chatMessage, chat, contactList) {
        let date = '[' + new Date(chatMessage.time).toLocaleString(this.locales) + ']';
        let senderName = await this.anonymizeMessageSender(chatMessage.sender, chat, contactList);
        let originalSenderName = await this.getMessageSender(chatMessage.sender, chat, contactList)
        let content = await this.anonymizeMessageContent(chatMessage.message, chat, contactList);
        return {
            compiled: date + ' ' + senderName + ': ' + content.message + '\n',
            date: date,
            sender: senderName,
            message: content.message,
            replacements: content.replacements,
            originalMessage: chatMessage.message,
            originalSender: originalSenderName,
            originalSenderId: chatMessage.sender
        };
    }

    async anonymizeChat(conversationSettings, chat, contactList){
        let conversationArray = []
        const conversation = chat.chat;
        if(conversation.length === 0) return conversationArray;
        let filteredChat = []
        if(conversationSettings.answer === 'one'){
            filteredChat.push(conversation[conversation.length - 1])
        } else if(conversationSettings.answer === 'five'){
            filteredChat.push(...conversation.slice(conversation.length - 5, conversation.length))
        } else {
            filteredChat.push(...conversation)
            // TO-DO compare with model limits
        }

        for(let chatMessage of filteredChat){
            conversationArray.push(await this.anonymizeMessage(chatMessage, chat, contactList));
        }
        return conversationArray
    }

    async getMessageSender(senderId, chat, contactList){
        if(senderId === selfId) {
            return await this.getDefaultMeName();
        }
        if(!contactList[senderId]) return senderId;
       return contactList[senderId].name;
    }

    async anonymizeMessageSender(senderId, chat, contactList){
        if( senderId === selfId) {
            return await this.getDefaultMeName();
        }
        if(!contactList[senderId]) return senderId;
        let senderKey;
        const senderName = contactList[senderId].name;
        for (let key of Object.keys(contactList[senderId].anonymizationMap)) {
            if(contactList[senderId].anonymizationMap[key].includes(senderName)){
                senderKey = key;
                break;
            }
        }
        if(!Object.keys(this.map).includes(senderName)){
            if(senderId !== selfId && (chat.type === 'private' || chat.type === 'bot')){
                this.map[senderName] = this.map.chatName
            }
            await this.loadReplacement(senderKey)
            this.map[senderName] = this.getReplacement(senderKey);
        }
        console.log('Private Parrot::Anonymization.js: Anonymizing message sender: [' + senderName + '] -> ' + this.map[senderName])
        return this.map[senderName]
    }

    async anonymizeMessageContent(content, chat, contactList){
        let members = Anonymization.getMembers(chat, contactList);
        members = members.filter((memberId) => Object.keys(contactList).includes(memberId)).map(((memberId) => contactList[memberId].anonymizationMap));
        const meName = await this.getDefaultMeName();
        let replacements = [];
        for (let member of members){
            for (let memberPrivateInformationCategory of Object.keys(member)) {
                for (let memberPrivateInformation of member[memberPrivateInformationCategory]) {
                    if(memberPrivateInformation === meName) continue;
                    let escapedMemberPrivateInformation = memberPrivateInformation
                        .replaceAll('(', '\\(').replaceAll(')','\\)')
                        .replaceAll('\+','\\+');
                    let regex = '(^|[\\n\\s\\W])(' + escapedMemberPrivateInformation + ')([\\s\\W]|$)'
                    const allMatches = Array.from(content.matchAll(regex)).reverse();
                    if (allMatches.length > 0) {
                        if (!Object.keys(this.map).includes(memberPrivateInformation)) {
                            await this.loadReplacement(memberPrivateInformationCategory)
                            this.map[memberPrivateInformation] = this.getReplacement(memberPrivateInformationCategory);
                        }
                        for(let match of allMatches){
                            const replacement = this.map[memberPrivateInformation];
                            const startIndex = match.index + match[1].length;
                            const endIndex = startIndex + match[2].length;
                            replacements = replacements.map((rep) => {
                                if(rep.start > startIndex){
                                    rep.start += (replacement.length - (endIndex-startIndex));
                                    rep.end += (replacement.length - (endIndex-startIndex));
                                }
                                return rep;
                            })
                            replacements.push({
                                original: content.substring(startIndex, endIndex),
                                replacement: this.map[memberPrivateInformation],
                                start: startIndex,
                                end: startIndex + replacement.length
                            })
                            content = content.substring(0, startIndex) + replacement + content.substring(endIndex)
                        }
                    }
                }
            }
        }
        content = content.replaceAll('\n', '\\n');
        replacements.sort((a, b) => {return b.start - a.start});
        return {message: content, replacements: replacements};
    }

    static getMembers(chat, contactList) {
        let members = [selfId]
        if (chat.type === 'group') {
            members.push(...contactList[chat.id].members)
        }
        members.push(chat.id)
        return members;
    }

    getReplacement(key){
        const choice = this.replacements[key].content;
        return choice[Math.floor(Math.random() * choice.length)];
    }

}