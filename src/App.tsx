import React, { useReducer } from 'react';
// import configuration from './utils/ICEServerConfig';
import logo from './logo.svg';
import firebase from 'firebase';
import './App.css';

type ConferenceState = {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  room: string | null,
  peerConnection: RTCPeerConnection | null
};

interface Action {
  type: string,
  payload?: MediaStream | string | RTCPeerConnection
}

const LOCALSTREAM = 'LOCALSTREAM';
const REMOTESTREAM = 'REMOTESTREAM';
const HANGUP = 'HANGUP';

const initialState: ConferenceState = {
  localStream: null,
  remoteStream: null,
  room: null,
  peerConnection: null
};

function reducer(state: ConferenceState, action: Action) {
  switch (action.type) {
    case LOCALSTREAM:
      return Object.assign({}, state, { localStream: action.payload });
    case REMOTESTREAM:
      return Object.assign({}, state, { remoteStream: action.payload });
    case HANGUP:
      return Object.assign({}, state, { localStream: null, remoteStream: null });
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
      type: LOCALSTREAM,
      payload: stream
    });
    dispatch({
      type: REMOTESTREAM,
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
    // if (roomId) {
    //   const db = firebase.firestore();
    //   const roomRef = db.collection('rooms').doc(roomId);
    //   const calleeCandidates = await roomRef.collection('calleeCandidates').get();
    //   calleeCandidates.forEach(async candidate => {
    //     await candidate.ref.delete();
    //   });
    //   const callerCandidates = await roomRef.collection('callerCandidates').get();
    //   callerCandidates.forEach(async candidate => {
    //     await candidate.ref.delete();
    //   });
    //   await roomRef.delete();
    // }

    // document.location.reload(true);
  }
  function registerPeerConnectionListeners() {
    if (!state.peerConnection) return;
    state.peerConnection.addEventListener('icegatheringstatechange', () => {
      console.log(
        `ICE gathering state changed: ${state.peerConnection!.iceGatheringState}`);
    });

    state.peerConnection.addEventListener('connectionstatechange', () => {
      console.log(`Connection state change: ${state.peerConnection!.connectionState}`);
    });

    state.peerConnection.addEventListener('signalingstatechange', () => {
      console.log(`Signaling state change: ${state.peerConnection!.signalingState}`);
    });

    state.peerConnection.addEventListener('iceconnectionstatechange ', () => {
      console.log(
        `ICE connection state change: ${state.peerConnection!.iceConnectionState}`);
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />

        {/* Grant access to media devices */}
        <div id="buttons">
          <button onClick={openUserMedia}>Access the media devices</button>
          <button onClick={hangUp}>Hang up</button>
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
