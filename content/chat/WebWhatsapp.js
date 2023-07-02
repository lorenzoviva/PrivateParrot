globalThis.WebWhatsapp = class WebWhatsapp extends WebChat {

    constructor() {
        super();
        this.existingInputField = null;
        this.generateButtonOverlay = null;
        this.inputInfoOverlay = null;
    }

    // overrides
    onReady(){
        console.log('WebWhatsapp chat list:', this.chatList)
        super.onReady()
    }
    onChatUpdate(){
        console.log('Private Parrot::WebWhatsapp.js > Whatsapp: selected chat: ', this.selectedChatId)
        console.log('Private Parrot::WebWhatsapp.js > Whatsapp: chat list: ', this.chatList)
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
                        console.log('Private Parrot::WebWhatsapp.js > Whatsapp: Added chat messages: ', chatMessages)
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
    // Query selectors for Whatsapp (parse>set, find>get)

    parseInputField(addedNode) {
        console.log('parsing input field')
        if (addedNode.querySelector('[data-testid="conversation-compose-box-input"]')) {
            this.setInputNode(addedNode.querySelector('[data-testid="conversation-compose-box-input"]'));
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
            this.inputNode.parentNode.parentNode.parentNode.parentNode.before(this.choseAnswerField);
            this.choseAnswerField.before(this.existingInputField);
            let onGenerate = this.onGenerate.bind(this);
            this.generateButtonOverlay.addEventListener('click', onGenerate);
            this.inputNode.addEventListener('keyup', function (e) {
                // if control + space
                if (e.ctrlKey && e.keyCode === 32) {
                    onGenerate();
                }
            })
            console.log('Private Parrot::WebWhatsapp.js > Whatsapp: Found input node: ', this.inputNode)
        }
        return false;
    }


    parseChatListChat(addedNode) {
        let updateChatList = false;
        if (addedNode.querySelector('[data-testid="cell-frame-title"] > span[title]')) {
            let peerTitles = addedNode.querySelectorAll('[data-testid="cell-frame-title"] > span[title]')
            peerTitles.forEach((peerTitle) => {
                let chatName = peerTitle.getAttribute('title');
                updateChatList |= this.addChatListChat(chatName, chatName);
            });

        }
        return updateChatList;
    }

    findChatInfo(){
        return document.querySelector('[data-testid="conversation-info-header"]');
    }

    findChatMessages(addedNode) {
        return Array.from(addedNode.querySelectorAll('[data-pre-plain-text]'));
    }

    findSelectedChatId() {
        let openChat = document.querySelector('[aria-selected="true"] > * > * > * > [data-testid="cell-frame-title"] > span[title]')
        if(!openChat){
            return null;
        }
        return openChat.getAttribute('title');

    }

    parseSelectedChatType() {
        let updateChatList = false;
        let chatInfo = this.findChatInfo().querySelector('span[title][aria-label]').getAttribute('title')
        // console.log('Private Parrot::WebWhatsapp.js > Whatsapp: selected chat information: ', chatInfo)
        if (chatInfo === 'You'){
            updateChatList |= this.setChatType('saved')
        }else if (chatInfo.includes('click here for group info') || chatInfo.includes(', You')) {
            updateChatList |= this.setChatType('group');
            if(chatInfo.includes(', You')){
                const numberOfMembers = chatInfo.split(', ').length
                updateChatList |= this.setGroupChatMemberNumber(numberOfMembers)
            }
        } else if(!this.getChatType()){
            updateChatList |= this.setChatType('private');
        }
        return updateChatList;
    }

    findInfoChatName() {
        return this.findChatInfo().querySelector('[data-testid="conversation-info-header-chat-title"]').innerText;
    }
    findInfoChatId() {
        return this.findChatInfo().querySelector('[data-testid="conversation-info-header-chat-title"]').innerText;
    }

    parseMessage(chatMessage) {
        let updateChatList = false;
        const messageTime = this.findMessageTime(chatMessage);
        const messageSender = this.parseMessageSender(chatMessage, updateChatList);
        const senderId = messageSender.senderId;
        updateChatList |= messageSender.updateChatList;
        const text = this.findMessageText(chatMessage);
        updateChatList |= this.addMessage({time: messageTime, sender: senderId, message: text});
        return updateChatList;
    }

    findMessageTime(chatMessage) {
        let timeMessage = chatMessage.getAttribute('data-pre-plain-text')
        timeMessage = timeMessage.substring(timeMessage.indexOf('[') + 1, timeMessage.indexOf(']'));
        const [time, date] = timeMessage.split(', ');
        const [hour, minute] = time.split(':');
        const [day, month, year] = date.split('/');
        timeMessage = new Date(year, month - 1, day, hour, minute);
        return Date.parse(timeMessage);
    }

    findGroupId(chatInfo){
        return chatInfo.querySelector('[data-testid="conversation-info-header-chat-title"]')?.innerText;

    }

    parseMessageSender(chatMessage, updateChatList) {
        if(chatMessage.parentNode.parentNode.querySelector('[aria-label="You:"]')) return {senderId: selfId, updateChatList: false};
        let senderId = chatMessage.getAttribute('data-pre-plain-text');
        senderId = senderId.substring(senderId.indexOf(']') + 2, senderId.length - 2);
        let chatType = this.getChatType();
        if (chatType === 'private' || chatType === 'bot') {
            updateChatList |= this.addContact(senderId, senderId,  'private');
        } else if(chatType === 'group'){
            updateChatList |= this.addContact(senderId, senderId,  'private');
            let groupId = this.findGroupId(this.findChatInfo())
            if(groupId){
                updateChatList |= this.addContact(groupId, groupId,  'group');
                updateChatList |= this.addGroupMember(groupId, senderId);
            }

        }
        return {senderId, updateChatList};
    }

    findMessageText(chatMessage) {
        let textMessageSpan = chatMessage.querySelector('.selectable-text.copyable-text>span')
        if(!textMessageSpan){
            if(textMessageSpan.querySelector('[data-testid="media-url-provider"]')){
                return '[image message]'
            }else if(textMessageSpan.querySelector('[aria-label="Voice message"]')){
                return '[voice message]'
            }else if(textMessageSpan.querySelector('[data-testid="video-pip"]')){
                return '[image message]'
            }
        }
        let clone = textMessageSpan.cloneNode(true);
        // replace images with alt text (for emoji support)
        clone.querySelectorAll('img[alt]')?.forEach((node) => node.replaceWith(node.alt))
        return clone.innerText;
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
    setAnswer(text){
        const span = this.inputNode.querySelector('p');
        // wait until paste all text
        function waitForPastedData(elem, old) {
            if (elem.childNodes && elem.childNodes.length == old) {
                return true
            }
            else {
                old = elem.childNodes.length
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(waitForPastedData(elem, old));
                    }, 2000);
                });
            }
        }
        async function send_text(text) {
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text', text);
            const event = new ClipboardEvent('paste', {
                clipboardData: dataTransfer,
                bubbles: true
            });
            span.focus()
            span.dispatchEvent(event)
            return await waitForPastedData(span, 0)
        }
        send_text(text).then()
    }
    onGenerate() {
        this.existingInputField.innerText = 'loading...'
        let message = {
            generateMessage: true,
            message: this.inputNode.innerText,
            provider: 'whatsapp',
            chat: this.selectedChatId
        };
        console.log('Private Parrot::WebWhatsapp.js: Sending message to background:', message);
        chrome.runtime.sendMessage(message, function callback(response) {
            console.log('Private Parrot::WebWhatsapp.js: Message from background: ', response);
            if(!response) return;
            if(response.length === 1) {
                this.setAnswer(response[0]);
            }else{
                this.choseAnswerField.innerHTML = '';
                for (let answer of response) {
                    const answerChoice = this.createButton(answer, false);
                    answerChoice.addEventListener('click', function (){
                       this.setAnswer(answer);
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