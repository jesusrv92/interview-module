import React, { useReducer } from 'react';
import configuration from './utils/ICEServerConfig';
import logo from './logo.svg';
import firebase from 'firebase';
import './App.css';

let firebaseApp = firebase.initializeApp({
  projectId: "fir-rtcchat"
})

type ConferenceState = {
  join: boolean
  mediaOpen: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  room: string | null,
  peerConnection: RTCPeerConnection | null
};

interface Action {
  type: string,
  payload?: MediaStream | string | RTCPeerConnection
}

const SETLOCALSTREAM = 'SETLOCALSTREAM';
const SETREMOTESTREAM = 'SETREMOTESTREAM';
const HANGUP = 'HANGUP';
const SETPEERCONNECTION = 'SETPEERCONNECTION';
const SETROOM = 'SETROOM';
const TOGGLEJOIN = 'TOGGLEJOIN';

const initialState: ConferenceState = {
  join: false,
  mediaOpen: false,
  localStream: null,
  remoteStream: null,
  room: null,
  peerConnection: null,
};

function reducer(state: ConferenceState, action: Action) {
  switch (action.type) {
    case SETLOCALSTREAM:
      return Object.assign({}, state, { localStream: action.payload, mediaOpen: true });
    case SETREMOTESTREAM:
      return Object.assign({}, state, { remoteStream: action.payload });
    case HANGUP:
      return Object.assign({}, state, { localStream: null, remoteStream: null, mediaOpen: true });
    case SETPEERCONNECTION:
      return Object.assign({}, state, { peerConnection: action.payload });
    case SETROOM:
      return Object.assign({}, state, { room: action.payload });
    case TOGGLEJOIN:
      return Object.assign({}, state, { join: !state.join });
    default:
      return state;
  }
}

// let peerConnection = new RTCPeerConnection(configuration);

function App() {

  const [state, dispatch] = useReducer(reducer, initialState);
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
    dispatch({ type: HANGUP })

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

    // document.location.reload(true);
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
      peerConnection.addTrack(track, state.localStream!);
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
        state.remoteStream!.addTrack(track);
      });
    });

    // Listening for remote session description
    roomRef.onSnapshot(async snapshot => {
      const data = snapshot.data();
      if (!peerConnection.currentRemoteDescription && data && data.answer) {
        console.log('Got remote description: ', data.answer);
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await peerConnection.setRemoteDescription(rtcSessionDescription);
      }
    });

    // Listen for remote ICE candidates
    roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
          await peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }
  function joinRoom() {
    dispatch({
      type: TOGGLEJOIN
    });
  }
  async function joinRoomById(roomId: string) {
    const db = firebaseApp.firestore();
    const roomRef = db.collection('rooms').doc(`${roomId}`);
    const roomSnapshot = await roomRef.get();
    console.log('Got room:', roomSnapshot.exists);

    if (roomSnapshot.exists) {
      console.log('Create PeerConnection with configuration: ', configuration);
      let peerConnection = new RTCPeerConnection(configuration);
      registerPeerConnectionListeners(peerConnection);

      state.localStream?.getTracks().forEach(track => {
        peerConnection.addTrack(track, state.localStream!);
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
          state.remoteStream!.addTrack(track);
        });
      });

      // Code for creating SDP answer
      const offer = roomSnapshot.data()!.offer;
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

    dispatch({
      type: TOGGLEJOIN
    })
  }
  function registerPeerConnectionListeners(peerConnection: RTCPeerConnection) {
    if (!peerConnection) return;
    peerConnection.addEventListener('icegatheringstatechange', () => {
      console.log(
        `ICE gathering state changed: ${peerConnection!.iceGatheringState}`);
    });

    peerConnection.addEventListener('connectionstatechange', () => {
      console.log(`Connection state change: ${peerConnection!.connectionState}`);
    });

    peerConnection.addEventListener('signalingstatechange', () => {
      console.log(`Signaling state change: ${peerConnection!.signalingState}`);
    });

    peerConnection.addEventListener('iceconnectionstatechange ', () => {
      console.log(
        `ICE connection state change: ${peerConnection!.iceConnectionState}`);
    });
  }
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        {/* Grant access to media devices */}
        <div id="buttons">
          <button onClick={openUserMedia}>Access the media devices</button>
          <div id="chat-buttons" hidden={!state.mediaOpen}>
            <button onClick={hangUp}>Hang up</button>
            <button onClick={createRoom}>Create room</button>
            <button onClick={joinRoom}>Join room</button>
          </div>
        </div>
        <div id="roomID" hidden={!state.join}>
          Enter roomID: <input onInput={e => {
            let input = e.target as HTMLInputElement
            dispatch({
              type: SETROOM,
              payload: input.value
            });
          }} type="text" /> <button onClick={() => {
            joinRoomById(state.room!);
          }}>Join</button>
        </div>
        <div id="room">
          <span>Current room: {state.room}</span>
        </div>

        {/* // React doesn't grant direct access to the srcObject property
        // We have to use a reference. */}
        <div id="videos">
          <video ref={video => {
            if (video) video.srcObject = state.localStream;
          }} muted autoPlay></video>
          <video ref={video => {
            if (video) video.srcObject = state.remoteStream;
          }} autoPlay></video>
        </div>

      </header>
    </div>
  );
}

export default App;
