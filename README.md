[Get Private Parrot for free](https://chrome.google.com/webstore/detail/private-parrot/fajfhpgedgeagjeninnlogilclofijmf)
# Private Parrot - Anonymized Web Chats AI replies powered by OpenAI & HuggingFace
This extension generates and completes responses in chats through AI, with a focus on privacy. Mask chats by replacing sensitive information with randomly generated data. The service is free, however the language models are paid, in the initial section it is described how to use this extension without any expense.
### ⚠ Requirements
In order to use the extension, a quick setup is required. The 🗨 webchat language must be set to English.
- For  Whatsapp change the Mobile App's language:
  - Open WhatsApp on your mobile device.
  - Tap More options (the button with three dots on the top right of screen).
  - Settings.
  - App Language.
  - Select the English language.
  - Reconnect to Web Whatsapp.
- For  Telegram:
  - Open the Web Telegram page.
  - Click More options (the button with three horizontal dashes on the top left of screen).
  - Settings.
  - Language.
  - Select the English language. 
  
An 🔑 API Key is required to access the 🧠 Language Model*.
You can choose from the Models available on  OpenAI and  HuggingFace.
Once you sign up you can use the instructions below to find the 🔑 API Key.
Get  OpenAI 🔑 API Key at openai.com/account/api-keys
Get  HuggingFace 🔑 API Key at huggingface.co/settings/tokens
Open the 📩 popup interface and select the desired 🧠 Language Model
Set the key and click on "Set key" button to save the API key.
  Alternatively, you can use the "Copy prompt chat" button in 📩 popup and paste it manually into any LLM chat (for example ChatGPT).
### 🗨 Web Chat Providers
For now the 🗨 webchats available are  Telegram and  Whatsapp, we intend to integrate further chats.
For the generation of responses it is necessary to collect some information from the 🗨 webchat site.
The information collected for a specific chat can be consulted on the 📩 popup interface, by selecting the App and the Chat at the top, the recorded text of the conversation appears.
We care about privacy, all data is stored on your browser and sent directly to the 🧠 model already masked.
The data can be deleted with the two buttons on top of the 📩 popup interface: ❌💾 Clear storage (performs a complete reset) and ♻ Clear cache (deletes conversations).
### 🕵 User Anonymization
In the 📩 popup interface, once you select a group or private chat you can specify further information to enforce privacy.
Anonymity will be guaranteed by replacing sensitive data (every 🔒 Name value in the 📩 popup table) with a randomly generated surrogate word. This will prevent your contact's personal information from being leaked.
You can choose the data to mask and avoid sending it to the 🧠 Language Model.
The replacements will be randomly sampled from the category selected in 🔑 Name key in the 📩 popup interface table.
The categories random examples were generated with ChatGPT in all languages.
### 💡 Tips
- If the 📎 overlay interface does not respond or remains in the loading state, press twice the 🔌 Restart button in the top left section of the 📩 popup to reload the extension (does not delete anything).
- You can scroll up in chat panel to gather older messages.
- The Prompt section is useful to specify the relationship with the chat members.
### 🖥 Interfaces
The extension consists of three 🖥 interfaces:
- The 📩 popup: Click on extension's icon (on top of the browser, next to the search bar) to open the 📩 popup interface
- An 📎 overlay for each 🗨 webchat. This interface will appear on top of the chat input text box.
- The 📰 Extension's manual page
### 💻 Developers
Feel free to make a pull request for a new language, a new webchat or to integrate with new models.
The project is open source and the repository is available at [GitHub/PrivateParrot](https://github.com/lorenzoviva/PrivateParrot).



    Palette: https://coolors.co/palette/d9ed92-b5e48c-99d98c-76c893-52b69a-34a0a4-168aad-1a759f-1e6091-184e77
