console.log('Private Parrot::content.js: open ', window.location.href)

if(window.location.href.startsWith('https://web.telegram.org')) {
    new WebTelegram()

}else if(window.location.href.startsWith('https://web.whatsapp.com')) {
    new WebWhatsapp();
}