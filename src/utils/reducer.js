import {
    SETLOCALSTREAM,
    SETREMOTESTREAM,
    HANGUP,
    SETPEERCONNECTION,
    SETROOM,
    SETINVITED
} from './actions'

const initialState = {
    invited: false,
    mediaOpen: false,
    localStream: null,
    remoteStream: null,
    room: null,
    peerConnection: null,
};

export default function reducer(state = initialState, action) {
    switch (action.type) {
        case SETLOCALSTREAM:
            return Object.assign({}, state, { localStream: action.payload, mediaOpen: true });
        case SETREMOTESTREAM:
            return Object.assign({}, state, { remoteStream: action.payload });
        case HANGUP:
            return Object.assign({}, initialState);
        case SETPEERCONNECTION:
            return Object.assign({}, state, { peerConnection: action.payload });
        case SETROOM:
            return Object.assign({}, state, { room: action.payload });
        case SETINVITED:
            return Object.assign({}, state, { invited: true });
        default:
            return state;
    }
}