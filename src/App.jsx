import React, { useReducer, useEffect } from 'react';
import configuration from './utils/ICEServerConfig';
import firebase from 'firebase/app';
import 'firebase/firestore';
import reducer from './utils/reducer';
import Clipboard from 'react-clipboard.js';

import VideoStream from './components/VideoStream'

import {
  SETLOCALSTREAM,
  SETREMOTESTREAM,
  HANGUP,
  SETPEERCONNECTION,
  SETROOM,
  SETINVITED
} from './utils/actions'
import './App.css';

let firebaseApp = firebase.initializeApp({
  projectId: "fir-rtcchat"
})

const initialState = {
  invited: false,
  mediaOpen: false,
  localStream: null,
  remoteStream: null,
  room: null,
  peerConnection: null,
};

function App() {
  // These global variables are a fallback in case the state hasn't been set yet when it's needed
  let localStreamGlobal, remoteStreamGlobal, peerConnectionGlobal;
  const [state, dispatch] = useReducer(reducer, initialState);
  let roomQuery = window.location.pathname.slice(1);

  useEffect(() => {
    async function invitation() {
      try {
        if (roomQuery && !state.mediaOpen) {
          await openUserMedia(dispatch);
          console.log('Could open media');
          dispatch({
            type: SETROOM,
            payload: roomQuery
          });
          dispatch({
            type: SETINVITED
          });
          console.log('Could dispatch room');
          await joinRoomById(roomQuery);
          console.log('Could join room');
        }
      }
      catch (e) {
        console.log(e);
        console.error('Error while trying to connect through invitation.')
        dispatch({
          type: HANGUP,
          payload: initialState
        });
      }
    }

    invitation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openUserMedia(dispatch) {
    // Ask for access to webcam and microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        { video: true, audio: true });
      localStreamGlobal = stream;
      dispatch({
        type: SETLOCALSTREAM,
        payload: stream
      });
      remoteStreamGlobal = new MediaStream()
      dispatch({
        type: SETREMOTESTREAM,
        payload: remoteStreamGlobal
      });
    }
    catch {
      console.error('Error while obtaining media');
      dispatch({
        type: HANGUP,
        payload: initialState
      });
    }
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
    let localStream = state.localStream || localStreamGlobal;
    let remoteStream = state.remoteStream || remoteStreamGlobal;

    const db = firebaseApp.firestore();
    const roomRef = await db.collection('rooms').doc();

    console.log('Create PeerConnection with configuration: ', configuration);
    let peerConnection = new RTCPeerConnection(configuration);
    peerConnectionGlobal = peerConnection;
    dispatch({
      type: SETPEERCONNECTION,
      payload: peerConnection
    });

    registerPeerConnectionListeners(peerConnection);

    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
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
        remoteStream.addTrack(track);
        console.log(remoteStream);
      });
      dispatch({
        type: SETREMOTESTREAM,
        payload: remoteStream
      });
    });

    // Listening for remote session description
    roomRef.onSnapshot(async snapshot => {
      const data = snapshot.data();
      let peerConnection = state.peerConnection || peerConnectionGlobal;
      if (!peerConnection.currentRemoteDescription && data && data.answer) {
        console.log('Got remote description: ', data.answer);
        const rtcSessionDescription = new RTCSessionDescription(data.answer);
        await peerConnection.setRemoteDescription(rtcSessionDescription);
      }
    });

    // Listen for remote ICE candidates
    roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        let peerConnection = state.peerConnection || peerConnectionGlobal;
        if (change.type === 'added') {
          let data = change.doc.data();
          console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
          await peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  }

  async function joinRoomById(roomId) {
    const db = firebaseApp.firestore();
    const roomRef = db.collection('rooms').doc(`${roomId}`);
    const roomSnapshot = await roomRef.get();
    console.log(state.localStream)
    console.log('Got room:', roomSnapshot.exists);

    if (roomSnapshot.exists) {
      let localStream = state.localStream || localStreamGlobal;
      let remoteStream = state.remoteStream || remoteStreamGlobal;

      console.log('Create PeerConnection with configuration: ', configuration);
      let peerConnection = new RTCPeerConnection(configuration);
      peerConnectionGlobal = peerConnection;
      dispatch({
        type: SETPEERCONNECTION,
        payload: peerConnection
      });
      registerPeerConnectionListeners(peerConnection);
      console.log('Peer connection is: ', peerConnection);

      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
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
          remoteStream.addTrack(track);
          console.log(remoteStream)
        });
        dispatch({
          type: SETREMOTESTREAM,
          payload: remoteStream
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
        {/* Grant access to media devices */}
        <div id="buttons">
          <button data-testid="open-media" onClick={openUserMedia} hidden={state.mediaOpen}>Access the media devices</button>
          <div id="chat-buttons" hidden={!state.mediaOpen}>
            <button id="hang-up" onClick={hangUp}>Hang up</button>
            <button id="create-room" onClick={createRoom}>Create room</button>
          </div>
        </div>
        <div id="room" hidden={!state.room}>
          <div>Current room: {state.room}</div>
          {!state.invited ? <Clipboard data-clipboard-text={window.location.origin + '/' + state.room}>
            Copy invitation to clipboard
          </Clipboard> : <></>}
        </div>

        <div id="videos">
          <VideoStream id="local" stream={state.localStream} muted={true} />
          <VideoStream id="remote" stream={state.remoteStream} />
        </div>

      </header>
    </div>
  );
}

export default React.memo(App);
