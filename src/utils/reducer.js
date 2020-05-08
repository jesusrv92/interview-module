import {
    SETLOCALSTREAM,
    SETREMOTESTREAM,
    HANGUP,
    SETPEERCONNECTION,
    SETROOM,
    TOGGLEJOIN
} from './actions'

export default function reducer(state, action) {
    switch (action.type) {
        case SETLOCALSTREAM:
            return Object.assign({}, state, { localStream: action.payload, mediaOpen: true });
        case SETREMOTESTREAM:
            return Object.assign({}, state, { remoteStream: action.payload });
        case HANGUP:
            return Object.assign({}, action.payload);
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