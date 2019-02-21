/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

const startButton = document.getElementById('startButton');
const hangupButton = document.getElementById('hangupButton');
hangupButton.disabled = true;

startButton.addEventListener('click', start);
hangupButton.addEventListener('click', hangup);

const selfView = document.getElementById('selfView');
const remoteView = document.getElementById('remoteView');


const constraints = {audio: true, video: true};
const configuration = {iceServers: [{urls: 'stun:stun.l.google.com:19302'}]};
const pc = new RTCPeerConnection(configuration);

let webSocket = null;

//判断当前浏览器是否支持WebSocket
let domain = window.location.host;
if ('WebSocket' in window) {
    webSocket = new WebSocket("wss://" + domain + "/exchange");
}
else {
    alert('当前浏览器 Not support websocket')
}

webSocket.onmessage = function (event) {
    // setMessageInnerHTML(event.data);
    let json = JSON.parse(event.data);
    onMessage(json);
};
webSocket.onclose = function (event) {
    console.info("*****webSocket onclose****")
};
webSocket.onbeforeunload = function () {
    console.info("*****webSocket****")
    webSocket.close();
};

function sendData(data) {
    webSocket.send(JSON.stringify(data))
}


// send any ice candidates to the other peer
pc.onicecandidate = ({candidate}) => {
    console.info("onicecandidate");
    sendData({candidate})
};

let setLocaled = false
// let the "negotiationneeded" event trigger offer generation
pc.onnegotiationneeded = async () => {
    console.info("onnegotiationneeded");
    if (setLocaled)
        return;
    setLocaled = true;
    try {
        await pc.setLocalDescription(await pc.createOffer());
        // send the offer to the other peer
        console.info("sendData Description");
        sendData({desc: pc.localDescription});
    } catch (err) {
        console.error(err);
    }
};

// once media for a remote track arrives, show it in the remote video element
pc.ontrack = (event) => {
    console.info("ontrack");
    // don't set srcObject again if it is already set.
    if (remoteView.srcObject) return;
    remoteView.srcObject = event.streams[0];
};

// call start() to initiate
async function start() {
    try {
        // get a local stream, show it in a self-view and add it to be sent
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        selfView.srcObject = stream;
    } catch (err) {
        console.error(err);
    }
}

async function onMessage({desc, candidate}) {
    try {
        if (desc) {
            // if we get an offer, we need to reply with an answer
            if (desc.type == 'offer') {

                console.info("setRemoteDescription");
                await pc.setRemoteDescription(desc);
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                stream.getTracks().forEach((track) => pc.addTrack(track, stream));
                await pc.setLocalDescription(await pc.createAnswer());
                sendData({desc: pc.localDescription});
                selfView.srcObject = stream;
            } else if (desc.type == 'answer') {
                await pc.setRemoteDescription(desc);
            } else {
                console.log('Unsupported SDP type. Your code may differ here.');
            }
        } else if (candidate) {
            //console.info(JSON.stringify(candidate))
            await pc.addIceCandidate(candidate);
        }
    } catch (err) {
        console.error(err);
    }
}


function hangup() {
    pc.close();
    hangupButton.disabled = true;
    callButton.disabled = false;
}
