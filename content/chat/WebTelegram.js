const selfId = '000000000';

globalThis.WebTelegram = class WebTelegram extends WebChat {

    constructor() {
        super();
        this.existingInputField = null;
        this.generateButtonOverlay = null;
        this.inputInfoOverlay = null;
    }


    // overrides
    onReady(){
        console.log('WebTelegram chat list:', this.chatList)
        super.onReady()
    }
    onChatUpdate(){
        console.log('Private Parrot::WebTelegram.js > Telegram: selected chat: ', this.selectedChatId)
        console.log('Private Parrot::WebTelegram.js > Telegram: chat list: ', this.chatList)
        super.onChatUpdate()
    }

    onPageChanged(mutationsList, observer) {
        let updateChatList = false;
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                let addedNodes = Array.from(mutation.addedNodes).filter(node => !(node instanceof Text));
                for (let addedNode of addedNodes) {
                    updateChatList |= this.parseInputField(addedNode);
                    updateChatList |= this.parseChatListChat(addedNode);
                    let chatMessages = this.findChatMessages(addedNode);
                    if (chatMessages.length > 0){
                        console.log('Private Parrot::WebTelegram.js > Telegram: Added chat messages: ', chatMessages)
                        this.selectedChatId = this.findSelectedChatId();
                        if(this.selectedChatId === null){
                            return
                        }
                        updateChatList |= this.parseSelectedChatType();
                        let infoChatName = this.findInfoChatName()
                        let infoChatId = this.findInfoChatId()
                        let chatType = this.getChatType();
                        if(chatType &&
                            chatType !== 'channel' &&
                            chatType !== 'saved' &&
                            infoChatId === this.selectedChatId
                        ){
                            updateChatList |= this.setChatName(infoChatName);
                            updateChatList |= this.parseMessages(chatMessages);
                        }
                        if(updateChatList){
                            this.onChatUpdate()
                        }
                    }
                }
            }
        }
    }

    addMessage(message) {
        return super.addMessage(this.selectedChatId, message);
    }

    setChatType(chatType){
        return super.setChatType(this.selectedChatId, chatType);
    }
    getChatType(){
        return super.getChatType(this.selectedChatId);
    }
    setChatName(chatName) {
        return super.setChatName(this.selectedChatId, chatName);
    }
    setGroupChatMemberNumber(numberOfMembers){
        return super.setGroupChatMemberNumber(this.selectedChatId, numberOfMembers)
    }

    getGroupChatMemberNumber(){
        return super.getGroupChatMemberNumber(this.selectedChatId);
    }

    addSelfContact(contactName){
        return super.addSelfContact(selfId, contactName);
    }
    // Query selectors for Telegram (parse>set, find>get)

    parseInputField(addedNode) {
        if (addedNode.querySelector('.input-message-input:not(.input-field-input-fake)')) {
            this.setInputNode(addedNode.querySelector('.input-message-input:not(.input-field-input-fake)'));
            this.existingInputField = document.createElement('div');
            this.choseAnswerField = document.createElement('div');
            this.generateButtonOverlay = this.createButton( '&#9193; Generate &#x270D;');
            this.inputInfoOverlay = document.createTextNode('ctrl + space to generate an answer')
            this.existingInputField.innerHTML = '';
            this.existingInputField.style.display = 'flex';
            this.existingInputField.style.justifyContent = 'space-between';
            this.existingInputField.style.padding  = '1rem';

            this.choseAnswerField.style.display = 'flex';
            this.choseAnswerField.style.justifyContent = 'space-between';
            this.choseAnswerField.style.alignItems = 'center';
            this.choseAnswerField.style.position  = 'relative';
            this.choseAnswerField.style.padding  = '1rem';

            this.existingInputField.appendChild(this.generateButtonOverlay);
            this.existingInputField.appendChild(this.inputInfoOverlay);
            this.inputNode.parentNode.parentNode.before(this.choseAnswerField);
            this.choseAnswerField.before(this.existingInputField);
            let onGenerate = this.onGenerate.bind(this);
            this.generateButtonOverlay.addEventListener('click', onGenerate);
            this.inputNode.addEventListener('keyup', function (e) {
                // if control + space
                if (e.ctrlKey && e.keyCode === 32) {
                    onGenerate();
                }
            })
            console.log('Private Parrot::WebTelegram.js > Telegram: Found input node: ', this.inputNode)
        }
        return false;
    }


    parseChatListChat(addedNode) {
        let updateChatList = false;
        if (addedNode.matches('a.chatlist-chat[data-peer-id]')) {
            let peerTitle = addedNode.querySelector('.row-title>.peer-title')
            let chatName = peerTitle.innerText;
            let chatId = addedNode.getAttribute('data-peer-id');
            updateChatList |= this.addChatListChat(chatId, chatName);
        }
        return updateChatList;
    }

    findChatInfo(){
        return document.querySelector('#column-center').querySelector('.chat-info-container');
    }

    findChatMessages(addedNode) {
        let chatMessages = Array.from(addedNode.querySelectorAll('.bubble-content>.message[dir],.bubble-content>.message.voice-message,.bubble-content>.attachment'))
        chatMessages = chatMessages.filter((element) => !element.classList.contains('message') || !element.nextSibling.classList.contains('attachment'));
        return chatMessages;
    }

    findSelectedChatId() {
        let openChat = document.querySelector('.chatlist-chat.active[data-peer-id]')
        if(!openChat){
            return null;
        }
        return openChat.getAttribute('data-peer-id');

    }

    parseSelectedChatType() {
        let updateChatList = false;
        if (this.selectedChatId.includes('Saved Messages')) {
            updateChatList |= this.setChatType('saved')
        } else {
            let chatInfo = this.findChatInfo().querySelector('.info').innerText
            // console.log('Private Parrot::WebTelegram.js > Telegram: selected chat information: ', chatInfo)
            if (chatInfo.includes('members')) {
                updateChatList |= this.setChatType('group');
                const numberOfMembers = Number.parseInt(chatInfo.replace(' members', ''))
                updateChatList |= this.setGroupChatMemberNumber(numberOfMembers)
            } else if (chatInfo.includes('subscribers')) {
                updateChatList |= this.setChatType('channel');
            } else if (chatInfo.includes('bot')) {
                updateChatList |= this.setChatType('bot');
            } else if(!this.getChatType()){
                updateChatList |= this.setChatType('private');
            }
        }
        return updateChatList;
    }

    findInfoChatName() {
        return this.findChatInfo().querySelector('.user-title>.peer-title').innerText;
    }
    findInfoChatId() {
        return this.findChatInfo().querySelector('avatar-element[data-peer-id]').getAttribute('data-peer-id');
    }

    parseMessage(chatMessage) {
        let updateChatList = false;
        const messageTime = this.findMessageTime(chatMessage);
        const chatMessageGroupPanel = this.findMessageGroupPanel(chatMessage);
        const messageSender = this.parseMessageSender(chatMessageGroupPanel, updateChatList);
        const senderId = messageSender.senderId;
        updateChatList |= messageSender.updateChatList;
        const text = this.findMessageText(chatMessage);
        updateChatList |= this.addMessage({time: messageTime, sender: senderId, message: text});
        return updateChatList;
    }

    findMessageTime(chatMessage) {
        let timeMessage = chatMessage.parentElement.querySelector('.tgico[title]').getAttribute('title')
        // forwarded message time (exclude Original)
        if (timeMessage.includes('\nOriginal:')) timeMessage = timeMessage.substr(0, timeMessage.indexOf('\nOriginal:'))
        if (timeMessage.includes('\nEdited:')) timeMessage = timeMessage.substr(0, timeMessage.indexOf('\nEdited:'))
        return Date.parse(timeMessage);
    }

    findMessageGroupPanel(chatMessage) {
        let chatMessageGroupPanel = chatMessage;
        while (chatMessageGroupPanel && !chatMessageGroupPanel.matches('div.bubbles-group')) chatMessageGroupPanel = chatMessageGroupPanel.parentElement;
        return chatMessageGroupPanel;
    }
    findGroupId(chatInfo){
        return chatInfo.querySelector('avatar-element.person-avatar[data-peer-id]')?.getAttribute('data-peer-id')
    }

    parseMessageSender(chatMessageGroupPanel, updateChatList) {
        let senderId = '';
        let chatType = this.getChatType();
        const chatInfo = this.findChatInfo();
        if (chatType === 'private' || chatType === 'bot') {
            if (chatMessageGroupPanel && chatMessageGroupPanel.querySelector('div.bubble.is-in')) {
                // incoming message
                senderId = chatInfo.querySelector('avatar-element.person-avatar[data-peer-id]')?.getAttribute('data-peer-id')
                let memberNameSpan = chatInfo.querySelector('div.user-title>span.peer-title[data-peer-id]');
                if (senderId && memberNameSpan && memberNameSpan.getAttribute('data-peer-id') === senderId) {
                    updateChatList |= this.addContact(senderId, memberNameSpan.innerText,  'private');
                }
            } else {
                // outgoing message
                senderId = selfId
            }

        } else {
            if (chatMessageGroupPanel.querySelector('div.bubble.is-in')) {
                // incoming message
                // Add the group 'contact'
                if(chatType === 'group'){
                    let groupId = this.findGroupId(chatInfo)
                    let groupNameSpan = chatInfo.querySelector('div.user-title>span.peer-title[data-peer-id]');
                    if(groupNameSpan){
                        if (groupId && groupNameSpan && groupNameSpan.getAttribute('data-peer-id') === groupId) {
                            updateChatList |= this.addContact(groupId, groupNameSpan.innerText,  'group');
                        }
                    }
                }
                // Add the sender contact
                senderId = chatMessageGroupPanel.querySelector('avatar-element.user-avatar[data-peer-id]')?.getAttribute('data-peer-id')
                let memberNameSpan = chatMessageGroupPanel.querySelector('div.bubble.is-in.is-group-first')?.querySelector('div.name.floating-part')?.querySelector('span.peer-title[data-peer-id]');
                if (memberNameSpan && memberNameSpan.getAttribute('data-peer-id') === senderId) {
                    updateChatList |= this.addContact(senderId, memberNameSpan.innerText,  'private');
                    // Add the sender to the group
                    if(chatType === 'group'){
                        let groupId = this.findGroupId(chatInfo)
                        this.addGroupMember(groupId, senderId);
                    }
                }
            } else {
                // outgoing message
                senderId = selfId
            }
        }
        return {senderId, updateChatList};
    }

    findMessageText(chatMessage) {
        if (chatMessage.classList.contains('voice-message')) {
            return '[voice message]'
        } else if (chatMessage.classList.contains('call-message')) {
            return '[voice call]'
        } else if (chatMessage.matches('.attachment.media-container') && chatMessage.querySelector('img,canvas')) {
            return '[image message]'
        } else if (chatMessage.matches('.attachment.media-sticker-wrapper') && !chatMessage.hasAttribute('data-sticker-emoji')) {
            return '[animated sticker message]'
        } else {
            let clone = chatMessage.cloneNode(true);
            // removes timespan
            clone.querySelector('.time.tgico')?.remove();
            // replace images with alt text (for emoji support)
            clone.querySelectorAll('img[alt]')?.forEach((node) => node.replaceWith(node.alt))
            if (clone.hasAttribute('data-sticker-emoji')) clone.innerText = clone.getAttribute('data-sticker-emoji');
            return clone.innerText;
        }
    }

    parseMessages(chatMessages) {
        let updateChatList = false;
        this.addSelfContact('Me')
        for (let chatMessage of chatMessages) {
            updateChatList |= this.parseMessage(chatMessage);
        }
        return updateChatList;
    }

    // Answer generation

    onGenerate() {
        this.existingInputField.innerText = 'loading...'
        let message = {
            generateMessage: true,
            message: this.inputNode.innerText,
            provider: 'telegram',
            chat: this.selectedChatId
        };
        console.log('Sending message: ', message);
        chrome.runtime.sendMessage(message, function callback(response) {
            console.log('Private Parrot::WebTelegram.js: Message from background: ', response);
            if(!response) return;
            if(response.length === 1) {
                this.inputNode.innerText += response[0];
            }else{
                this.choseAnswerField.innerHTML = '';
                for (let answer of response) {
                    const answerChoice = this.createButton(answer, false);
                    answerChoice.addEventListener('click', function (){
                        this.inputNode.innerText += answer;
                    }.bind(this))
                    this.choseAnswerField.append(answerChoice)
                }
            }
            this.existingInputField.innerHTML = '';
            this.existingInputField.appendChild(this.generateButtonOverlay);
            this.existingInputField.appendChild(this.inputInfoOverlay);

        }.bind(this));
    }
}