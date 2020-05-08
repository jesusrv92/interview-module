import React, { useReducer } from 'react';
import configuration from './utils/ICEServerConfig';
// import logo from './logo.svg';
import firebase from 'firebase/app';
import 'firebase/firestore';
import reducer from './utils/reducer';
import Clipboard from 'react-clipboard.js';

import {
  SETLOCALSTREAM,
  SETREMOTESTREAM,
  HANGUP,
  SETPEERCONNECTION,
  SETROOM,
  TOGGLEJOIN
} from './utils/actions'
import './App.css';

let firebaseApp = firebase.initializeApp({
  projectId: "fir-rtcchat"
})

const initialState = {
  join: false,
  mediaOpen: false,
  localStream: null,
  remoteStream: null,
  room: null,
  peerConnection: null,
};

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  let roomQuery = window.location.pathname.slice(1);

  if (roomQuery && !state.mediaOpen) {
    openUserMedia().then(() => {
      dispatch({
        type: SETROOM,
        payload: roomQuery
      });
      return joinRoomById(roomQuery);
    }).catch(e => e)
  }

  async function openUserMedia() {
    // Ask for access to webcam and microphone
    const stream = await navigator.mediaDevices.getUserMedia(
      { video: true, audio: true });
    dispatch({
      type: SETLOCALSTREAM,
      payload: stream
    });
    dispatch({
      type: SETREMOTESTREAM,
      payload: new MediaStream()
    });
  }

  async function hangUp() {
    const tracks = state.localStream?.getTracks();
    if (!tracks) return;
    // Stop all media tracks for streams and set them to null
    tracks.forEach(track => {
      track.stop();
    });
    if (state.remoteStream) {
      state.remoteStream.getTracks().forEach(track => track.stop());
    }
    if (state.peerConnection) {
      state.peerConnection.close();
    }
    dispatch({ type: HANGUP, payload: initialState });

    // Delete room on hangup
    if (state.room) {
      const db = firebaseApp.firestore();
      const roomRef = db.collection('rooms').doc(state.room);
      const calleeCandidates = await roomRef.collection('calleeCandidates').get();
      calleeCandidates.forEach(async candidate => {
        await candidate.ref.delete();
      });
      const callerCandidates = await roomRef.collection('callerCandidates').get();
      callerCandidates.forEach(async candidate => {
        await candidate.ref.delete();
      });
      await roomRef.delete();
    }
  }

  async function createRoom() {
    if (!state.localStream) return;
    const db = firebaseApp.firestore();
    const roomRef = await db.collection('rooms').doc();

    console.log('Create PeerConnection with configuration: ', configuration);
    let peerConnection = new RTCPeerConnection(configuration);

    dispatch({
      type: SETPEERCONNECTION,
      payload: peerConnection
    });

    registerPeerConnectionListeners(peerConnection);

    state.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, state.localStream);
    });

    // Code for collecting ICE candidates
    const callerCandidatesCollection = roomRef.collection('callerCandidates');

    peerConnection.addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        return;
      }
      console.log('Got candidate: ', event.candidate);
      callerCandidatesCollection.add(event.candidate.toJSON());
    });

    // Code for creating a room
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('Created offer:', offer);

    const roomWithOffer = {
      'offer': {
        type: offer.type,
        sdp: offer.sdp,
      },
    };
    await roomRef.set(roomWithOffer);
    let roomId = roomRef.id;
    dispatch({
      type: SETROOM,
      payload: roomId
    });
    console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);

    peerConnection.addEventListener('track', event => {
      console.log('Got remote track:', event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        console.log('Add a track to the remoteStream:', track);
        state.remoteStream.addTrack(track);
        console.log(state.remoteStream);
      });
      dispatch({
        type: SETREMOTESTREAM,
        payload: state.remoteStream
      });
    });

    // Listening for remote session description
    roomRef.onSnapshot(async snapshot => {
      const data = snapshot.data();
      if (!state.peerConnection?.currentRemoteDescription && data && data.answer) {
        console.log('Got remote description: ', data.answer);
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await state.peerConnection.setRemoteDescription(rtcSessionDescription);
      }
    });

    // Listen for remote ICE candidates
    roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
          await state.peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }

  function toggleJoinRoomInput() {
    dispatch({
      type: TOGGLEJOIN
    });
  }

  async function joinRoomById(roomId) {
    const db = firebaseApp.firestore();
    const roomRef = db.collection('rooms').doc(`${roomId}`);
    const roomSnapshot = await roomRef.get();
    console.log('Got room:', roomSnapshot.exists);

    if (roomSnapshot.exists) {
      console.log('Create PeerConnection with configuration: ', configuration);
      let peerConnection = new RTCPeerConnection(configuration);
      dispatch({
        type: SETPEERCONNECTION,
        payload: peerConnection
      });
      registerPeerConnectionListeners(peerConnection);

      state.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, state.localStream);
      });

      // Code for collecting ICE candidates
      const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
      peerConnection.addEventListener('icecandidate', event => {
        if (!event.candidate) {
          console.log('Got final candidate!');
          return;
        }
        console.log('Got candidate: ', event.candidate);
        calleeCandidatesCollection.add(event.candidate.toJSON());
      });

      peerConnection.addEventListener('track', event => {
        console.log('Got remote track:', event.streams[0]);
        event.streams[0].getTracks().forEach(track => {
          console.log('Add a track to the remoteStream:', track);
          state.remoteStream.addTrack(track);
          console.log(state.remoteStream)
        });
        dispatch({
          type: SETREMOTESTREAM,
          payload: state.remoteStream
        });
      });

      // Code for creating SDP answer
      const offer = roomSnapshot.data().offer;
      console.log('Got offer:', offer);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      console.log('Created answer:', answer);
      await peerConnection.setLocalDescription(answer);

      const roomWithAnswer = {
        answer: {
          type: answer.type,
          sdp: answer.sdp,
        },
      };
      await roomRef.update(roomWithAnswer);

      // Listening for remote ICE candidates
      roomRef.collection('callerCandidates').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
          if (change.type === 'added') {
            let data = change.doc.data();
            console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
            await peerConnection.addIceCandidate(new RTCIceCandidate(data));
          }
        });
      });
    }
  }

  function registerPeerConnectionListeners(peerConnection) {
    if (!peerConnection) return;
    peerConnection.addEventListener('icegatheringstatechange', () => {
      console.log(
        `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
    });

    peerConnection.addEventListener('connectionstatechange', () => {
      console.log(`Connection state change: ${peerConnection.connectionState}`);
    });

    peerConnection.addEventListener('signalingstatechange', () => {
      console.log(`Signaling state change: ${peerConnection.signalingState}`);
    });

    peerConnection.addEventListener('iceconnectionstatechange ', () => {
      console.log(
        `ICE connection state change: ${peerConnection.iceConnectionState}`);
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        {/* <img src={logo} className="App-logo" alt="logo" /> */}

        {/* Grant access to media devices */}
        <div id="buttons">
          <button onClick={openUserMedia} hidden={state.mediaOpen}>Access the media devices</button>
          <div id="chat-buttons" hidden={!state.mediaOpen}>
            <button onClick={hangUp}>Hang up</button>
            <button onClick={createRoom}>Create room</button>
            <button onClick={toggleJoinRoomInput}>Join room</button>
          </div>
        </div>
        <div id="roomID" hidden={!state.join}>
          Enter roomID: <input onInput={e => {
            let input = e.target;
            dispatch({
              type: SETROOM,
              payload: input.value
            });
          }} type="text" /> <button onClick={() => {
            toggleJoinRoomInput();
            joinRoomById(state.room);
          }}>Join</button>
        </div>
        <div id="room" hidden={!state.room}>
          <span>Current room: {state.room}</span>
          <Clipboard data-clipboard-text={window.location.origin + '/' + state.room}>
            Copy invitation to clipboard
          </Clipboard>
        </div>

        {/* // React doesn't grant direct access to the srcObject property
        // We have to use a reference. */}
        <div id="videos">
          <video id="local" ref={video => {
            if (video) video.srcObject = state.localStream;
          }} muted autoPlay></video>
          <video id="remote" ref={video => {
            if (video) video.srcObject = state.remoteStream;
          }} autoPlay></video>
        </div>

      </header>
    </div>
  );
}

export default App;
