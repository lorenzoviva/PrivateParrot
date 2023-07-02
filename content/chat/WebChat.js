
globalThis.WebChat = class WebChat {
    constructor() {
        this.chatList = {};
        this.contactList = {};
        this.inputNode = null;
        this.loadChat(this.onReady.bind(this))
    }
    onReady(){
        this.observer = new MutationObserver(this.onPageChanged.bind(this));
        this.observer.observe(document.body, { childList: true, subtree: true });
    }
    setChatList(chatList) {
        this.chatList = chatList;
    }

    addChatListChat(chatId, chatName){
        if (!Object.keys(this.chatList).includes(chatId)) {
            this.chatList[chatId] = {
                chat: [],
                name: chatName,
                id: chatId
            };
            return true;
        } else {
            return false;
        }
    }
    setChatType(chatId, chatType){
        if(!Object.keys(this.chatList[chatId]).includes('type') || this.chatList[chatId].type !== chatType){
            this.chatList[chatId].type = chatType;
            if(chatType === 'group' && Object.keys(this.chatList[chatId]).includes('chat'))
                this.chatList[chatId].chat = this.chatList[chatId].chat.filter((message) => message.sender !== chatId);
            return true;
        }else{
            return false;
        }
    }
    getChatType(chatId){
        return this.chatList[chatId].type;
    }
    setChatName(chatId, chatName){
        if(!Object.keys(this.chatList[chatId]).includes('name') || this.chatList[chatId].name !== chatName){
            this.chatList[chatId].name = chatName;
            return true;
        }else{
            return false;
        }
    }
    setGroupChatMemberNumber(chatId, numberOfMembers){
        if(!Object.keys(this.chatList[chatId]).includes('numberOfMembers') || this.chatList[chatId].numberOfMembers !== numberOfMembers){
            this.chatList[chatId].numberOfMembers = numberOfMembers;
            return true;
        }else{
            return false;
        }
    }
    getGroupChatMemberNumber(chatId){
        return this.chatList[chatId].numberOfMembers;
    }

    addMessage(chatId, message){
        if (!this.chatList[chatId].chat.find((otherMessage) => otherMessage.time === message.time && otherMessage.sender === message.sender)) {
            this.chatList[chatId].chat.push(message)
            this.chatList[chatId].chat.sort((a, b) => a.time - b.time)
            return true;
        }else{
            return false;
        }
    }
    setInputNode(inputNode) {
        this.inputNode = inputNode
    }
    setContactList(contactList) {
        this.contactList = contactList;
    }
    addContact(contactId, contactName, type){
        if(!Object.keys(this.contactList).includes(contactId)){
            let anonymizationMap = {};
            if(type === 'group') {
                anonymizationMap['company_name'] = [ contactName ]
            } else {
                anonymizationMap['name'] = [ contactName ]
            }
            this.contactList[contactId] = {
                id: contactId,
                name: contactName,
                type: type,
                anonymizationMap: anonymizationMap
            };
            if(type === 'group') this.contactList[contactId].members = [];
            return true;
        } else if(this.contactList[contactId].type === 'private' && type !== 'private'){
            // groups and other types can turn from private to 'group','bot', etc...
            this.contactList[contactId].type = type;
            let anonymizationMap = {};
            if(type === 'group') {
                anonymizationMap['company_name'] = [ contactName ]
            } else {
                anonymizationMap['name'] = [ contactName ]
            }
            this.contactList[contactId].anonymizationMap = anonymizationMap;
            if(type === 'group') this.contactList[contactId].members = [];
            return true;
        }
        return false;
    }

    addSelfContact(contactId, contactName){
        if(!Object.keys(this.contactList).includes(contactId) || this.contactList[contactId].name !== contactName){
            this.contactList[contactId] = {
                id: contactId,
                name: contactName,
                type: 'private',
                anonymizationMap: {name: [ contactName ]}
            };
            return true;
        }
        return false;
    }
    addGroupMember(groupId, contactId){
        if(!this.contactList[groupId].members.includes(contactId)){
            this.contactList[groupId].members.push(contactId);
            return true;
        }
        return false;
    }
    onPageChanged(mutationsList, observer){
        // override
    }
    loadChat(onReady){
        chrome.runtime.sendMessage({ contentScriptReady: true }, function callback(webChat){
            console.log('Private Parrot::WebChat.js: Loading web-chat from background: ', webChat);
            if(webChat !== null){
                if(webChat.chatList) this.setChatList(webChat.chatList);
                if(webChat.contactList) this.setContactList(webChat.contactList);
            }
            onReady()
        }.bind(this));
    }
    onChatUpdate(){
        chrome.runtime.sendMessage({ webChat: {chatList: this.chatList, contactList: this.contactList} });
    }

    createButton(content, gradient=true) {
        let generateButtonOverlay = document.createElement('a');
        generateButtonOverlay.innerHTML = content;
        if(gradient) {
            generateButtonOverlay.style.background = 'linear-gradient(28deg, #52B69A 0%, #D9ED92 100%)';
        }else{
            generateButtonOverlay.style.background = '#D9ED92';
        }
        generateButtonOverlay.style.padding = '0.5rem';
        generateButtonOverlay.style.borderRadius = '1.5rem';
        generateButtonOverlay.style.marginRight = '1.0rem';
        generateButtonOverlay.style.color = '#191919';
        generateButtonOverlay.style.border = 'unset';
        generateButtonOverlay.style.boxShadow = '3px 3px #99D98CF0';
        generateButtonOverlay.style.cursor = 'pointer';
        generateButtonOverlay.onmouseenter = function (){
            generateButtonOverlay.style.boxShadow = '';
        };
        generateButtonOverlay.onmouseleave = function (){
            generateButtonOverlay.style.boxShadow = '3px 3px #99D98CF0';
        };
        return generateButtonOverlay;
    }

}