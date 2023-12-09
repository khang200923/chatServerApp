const form = document.getElementById('requestForm');
const nameElem = document.getElementById('name');
const messageElem = document.getElementById('message');
const replyElem = document.getElementById('replyID');

document.addEventListener('click', function(event) {
    var target = event.target;

    if (target.classList.contains('msgIDOrigin')) {
        replyElem.value = Number(target.getAttribute('msg-id'));
    }

    if (target.classList.contains('msgIDRedirect')) {
        document.getElementById(`msgid-origin-${target.getAttribute('msg-id')}`)
        .scrollIntoView({ behavior: 'smooth' });
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = nameElem.value;
    const message = messageElem.value;
    const replyID = Number(replyElem.value);
    if (!sendAllowed(name, message)) {
        messageElem.value = "Invalid name/message•";
        return;
    }
    sendMessage(name, message, replyID);
    messageElem.value = "";
    replyElem.value = "";
});

function sendMessage(name, message, replyID) {
    fetch('/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, message, replyID })
    })
    .then(response => {
        if (response.ok) {
            console.log('Message sent successfully');
        } else {
            console.error('Error sending message');
        }
    })
    .catch(error => {
        console.error('Error sending message', error);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    setInterval(updateMsgs, 1000);
});

async function updateMsgs() {
    try {
        const response = await fetch('messages.txt');
        const msgs = formatMsgs(await response.text());

        msgsTag = document.getElementById('messages');
        msgsTag.innerHTML = "";
        for (i=msgs.length-1;i>=0;i--) {
            msgTag = document.createElement('p');
            msgIDTag = document.createElement('span');
            msgIDTag.innerHTML = `[${msgs[i][0]}]`;
            msgIDTag.setAttribute('class', 'msgIDOrigin');
            msgIDTag.setAttribute('msg-id', `${msgs[i][0]}`);
            msgIDTag.setAttribute('id', `msgid-origin-${msgs[i][0]}`);
            msgTag.appendChild(msgIDTag)
            if (Number(msgs[i][4]) != 0) {
                msgTag.appendChild(document.createTextNode(` -> `))
                replyIDTag = document.createElement('span');
                replyIDTag.innerHTML = `[${msgs[i][4]}]`;
                replyIDTag.setAttribute('class', 'msgIDRedirect');
                replyIDTag.setAttribute('msg-id', `${msgs[i][4]}`);
                msgTag.appendChild(replyIDTag);
            }
            msgTag.appendChild(document.createTextNode(` <${msgs[i][1]}> ${msgs[i][3]}`))
            if (msgs[i][1] == 'admin') {
                msgTag.setAttribute('class', 'admin');
            } else if (msgs[i][1] == 'system') {
                msgTag.setAttribute('class', 'system');
            }
            msgsTag.appendChild(msgTag);
        }

    } catch (error) {
        console.error('Error fetching the msg file:', error);
    }
}
