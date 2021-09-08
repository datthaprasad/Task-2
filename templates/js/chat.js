const studentId = document.getElementById("studentId").innerHTML;
const myId = document.getElementById("myId").innerHTML;
const fromId = document.getElementById("fromId").innerHTML;
const toId = document.getElementById("toId").innerHTML;
const fromName = document.getElementById("fromName").innerHTML.replace("*", "");
const toName = document.getElementById("toName").innerHTML.replace("*", "");
const teacherId = document.getElementById("teacherId").innerHTML;
const socket = io({ query: `userId=${myId}` })

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $messages = document.querySelector('#messages')
const $body = document.querySelector('body')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

window.addEventListener('load', (e) => {
    e.preventDefault();

    socket.emit('isOnline', toId, (error) => {
        if (!error)
            document.getElementById('isOnline').style.color = 'chartreuse';
        else
            document.getElementById('isOnline').style.color = 'red';

    })

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight
    $messages.scrollTop = containerHeight
    if (containerHeight <= scrollOffset) {
        $messages.scrollTop = containerHeight
    }
})

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

    socket.emit('isOnline', toId, (error) => {
        if (!error)
            document.getElementById('isOnline').style.color = 'chartreuse';
        else
            document.getElementById('isOnline').style.color = 'red';

    })
}


socket.on('message', (message) => {
    console.log(message);
    if (message.from === teacherId && message.to === myId || message.to === myId && message.from === studentId)
        sentMessage = `<div class="message" style="border: 2px solid pink;padding:15px;width:max-content;border-radius:20px;"><p><span style="" class="message__name">${toName}</span><span class="message__meta">${moment(message.createdAt).format('h:mm a, D-M-YYYY')}</span></p><p>${message.message}</p></div>`
    if (sentMessage)
        $messages.insertAdjacentHTML('beforeend', sentMessage)
    autoscroll()
})


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled')
    const messageData = {
        message: e.target.elements.message.value,
        from: fromId,
        to: toId,
        teacher: teacherId,
        student: studentId
    };


    socket.emit('sendMessage', messageData, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return alert(error)
        }
        const sentMessage = `<div class="message" style="border: 2px solid blue;padding:15px;width:max-content;border-radius:20px;margin-left:auto;"><p><span style="" class="message__name">${fromName}</span><span class="message__meta">${moment().format('h:mm a, D-M-YYYY')}</span></p><p>${messageData.message}</p></div>`
        if (sentMessage)
            $messages.insertAdjacentHTML('beforeend', sentMessage);

        autoscroll();

    })


})




// socket.emit('join', { username, room }, (error) => {
//     if (error) {
//         alert(error)
//         location.href = '/'
//     }
// })