const regexValidUsername = /^[A-Za-z0-9\s_]+$/;
const regexValidStr = /^[A-Za-z0-9`~!@#$%^&*()-_=+\[\]{}|;:'",.<>/?\s]+$/;
const forbiddenUsernames = ['admin', 'bot', 'system'];

function sendAllowed(name, msg) {
    return regexValidUsername.test(name) &&
    regexValidStr.test(msg) &&
    (name != '') && (msg != '') &&
    (name.length <= 32) && (msg.length <= 1024) &&
    (!forbiddenUsernames.includes(name))
}

function formatMsgs(str) {
    msgs = str.split('\n');
    for(i=0;i<msgs.length;i++) {
        msgs[i] = msgs[i].split('•')
    }
    msgs.pop()
    return msgs;
}

module.exports = {
    sendAllowed: sendAllowed,
    formatMsgs: formatMsgs,
}
