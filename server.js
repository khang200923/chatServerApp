const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const os = require('os');
const app = express();
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const utils = require('./utils.js');

///////////////////Consts and var inits START
const allowedFiles = ['/', '/index.html', '/client.js', '/utils.js', '/messages.txt', '/styles.css', '/send'];
const adminUsername = '90320b9e12785cd2019b3589059360ecba3f4d79517fac0ad0d2ea66dbc8e13c'; //SHA-256ed
const initMsgFile =
`-3•system•0•If the chat history was recently wiped and these messages appeared again, the chat might have been reset by <admin>.•0
-2•system•0•You can also click on a message ID to reply.•0
-1•system•0•Welcome to this chat server. Enter 'Name' and 'Message...' slots above to continue.•0
`;

var nextMsgId = 1;
var openChat = true;
///////////////////Consts and var inits END

///////////////////Util functions START
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();

    for (const interfaceName in interfaces) {
        const networkInterface = interfaces[interfaceName];

        for (const network of networkInterface) {
            // Skip over non-IPv4 and internal (i.e., 127.0.0.1) addresses
            if (network.family === 'IPv4' && !network.internal) {
                return network.address;
            }
        }
    }

    return null; // Return null if no LAN address is found
}

function msgsToStr(msgs) {
    let res = '';
    for (i=0;i<msgs.length;i++) {
        const msg = msgs[i];
        res += `${msg[0]}•${msg[1]}•${msg[2]}•${msg[3]}•${msg[4]}\n`;
    }
    return res;
}

function calculateSHA256(input) {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}

const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: 'I have had enough of this... GET /out! Wait, you can\'t.',
});
///////////////////Util functions END

///////////////////Uses and middlewares and server functions START
const restrictAccess = (req, res, next) => {
    const requestedFile = req.url;

    if (allowedFiles.includes(requestedFile)) {
        next();
    } else {
        res.status(403).send('Access Forbidden... anyways never gonna give you up');
    }
};

app.use(limiter, restrictAccess, express.static(__dirname));
app.use(bodyParser.json());

app.post('/send', (req, res) => {
    const name = req.body.name;
    const message = req.body.message;
    const replyID = req.body.replyID;
    if (!utils.sendAllowed(name, message)) {
        console.error('Message not allowed');
        res.sendStatus(400);
        return;
    }
    nameRepr = (calculateSHA256(name) == adminUsername) ? 'admin' : name;
    if (openChat || nameRepr == 'admin') {
        console.log(`Message <${name}> ${message}`);

        sendMessage(nameRepr, Date.now(), message, replyID);

        if (nameRepr == 'admin' && message[0] == '$') {
            runCommand(message.slice(1).split(' '), nextMsgId);
        }

        res.sendStatus(200);
    } else {
        console.error('Message not allowed');
        res.status(403).send('Chat closed');
    }
});

function sendMessage(nameRepr, time, message, replyID) {
    fs.appendFile('messages.txt', `${nextMsgId}•${nameRepr}•${time}•${message}•${replyID}` + '\n', (err) => {
        if (err) {
            console.error('Error updating msg file:', err);
            res.sendStatus(500);
            return;
        } else {
            nextMsgId++;
        }
    });
}

function runCommand(command, replyID) {
    fs.readFile('messages.txt', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading msg file:', err);
            sendMessage('system', Date.now(), 'Oops! Error reading msg file.', replyID);
            return;
        }
        let msgs = utils.formatMsgs(data);
        if (command[0] == 'censor') {
            let line = msgs.indexOf(msgs.find((msg) => Number(msg[0]) === Number(command[1])));
            if (line === -1) {
                console.error(`Cannot find such message with ID ${command[1]}:`);
                sendMessage('system', Date.now(), `Oops! Cannot find such message with ID ${command[1]}.`, replyID);
                return;
            }
            msgs[line][3] = '######';
            fs.writeFile('messages.txt', msgsToStr(msgs), 'utf8', (err) => {
                if (err) {
                    console.error('Error writing msg file:', err);
                    sendMessage('system', Date.now(), 'Oops! Error writing msg file.', replyID);
                    return;
                }
                sendMessage('system', Date.now(), `Success. Censored Message [${command[1]}].`, replyID);
            });
        } else if (command[0] == 'blockchat') {
            openChat = false;
            sendMessage('system', Date.now(), 'Success. Chat closed.', replyID);
        } else if (command[0] == 'openchat') {
            openChat = true;
            sendMessage('system', Date.now(), 'Success. Chat opened.', replyID);
        } else if (command[0] == 'resetchat') {
            fs.writeFile('messages.txt', initMsgFile, (err) => {
                if (err) {
                    console.error('Error resetting msg file:', err);
                    sendMessage('system', Date.now(), 'Oops! Error resetting msg file.', replyID);
                }
            });
        } else {
            sendMessage('system', Date.now(), 'Oops! Invalid command.', replyID);
        }
    })
}
///////////////////Uses and middlewares and server functions END

fs.writeFile('messages.txt', initMsgFile, (err) => {
    if (err) {
        console.error('Error resetting msg file:', err);
    }
});

const port = 80;
const host = '0.0.0.0';
app.listen(port, host, () => {
    console.log(`Server running at http://${getLocalIpAddress()}:${port}`);
});
