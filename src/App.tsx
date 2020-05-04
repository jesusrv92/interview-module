import React, { useReducer } from 'react';
import configuration from './utils/ICEServerConfig';
import logo from './logo.svg';
import './App.css';

type ConferenceState = {
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  room: string | null,
  peerConnection: RTCPeerConnection | null
};

interface Action {
  type: string,
  payload: MediaStream | string | RTCPeerConnection
}

const LOCALSTREAM = 'LOCALSTREAM';
const REMOTESTREAM = 'REMOTESTREAM';

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

    if(!tracks) return;
    
    tracks.forEach(track => {
      track.stop();
    });
  
    if (state.remoteStream) {
      state.remoteStream.getTracks().forEach(track => track.stop());
    }
  
    // if (peerConnection) {
    //   peerConnection.close();
    // }
  
    // document.querySelector('#localVideo').srcObject = null;
    // document.querySelector('#remoteVideo').srcObject = null;
    // document.querySelector('#cameraBtn').disabled = false;
    // document.querySelector('#joinBtn').disabled = true;
    // document.querySelector('#createBtn').disabled = true;
    // document.querySelector('#hangupBtn').disabled = true;
    // document.querySelector('#currentRoom').innerText = '';
  
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
  // openUserMedia();
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {/* Grant access to media devices */}
        <button onClick={openUserMedia}>Access the media devices</button>
        <button onClick={hangUp}>Hang up</button>

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
