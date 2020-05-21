import reducer from './reducer';
import initialState from './initialState'
// import { renderHook, act } from '@testing-library/react-hooks'
// import { useReducer } from 'react'
import {
    SETLOCALSTREAM,
    SETREMOTESTREAM,
    HANGUP,
    SETPEERCONNECTION,
    SETROOM,
    SETINVITED
} from './actions'

describe('Reducer test', () => {
    // const { result, waitForNextUpdate } = renderHook(() => useReducer(reducer, initialState));
    // const [state, dispatch] = result.current;


    test('Should return initialState', () => {
        const state = reducer(initialState);
        expect(state).toMatchObject(initialState);
    });

    test('Should update given state', () => {
        const state = reducer(initialState);

        const modifiedState = reducer(state, { type: SETINVITED });
        
        expect(state.invited).toBe(false);
        expect(modifiedState.invited).toBe(true);
    });
   
    test('Returned state should be different than given state', () => {
        const state = reducer(initialState);

        const modifiedState = reducer(state, { type: SETINVITED });
        
        expect(state).not.toBe(modifiedState);
    });
        // act(() => {
        // console.log(reducer, initialState);
        // const { result } = renderHook(() => useReducer(reducer, initialState));
        // const [state, dispatch] = result.current;
        // dispatch({type: SETINVITED});
        // });
        // expect(state.invited).toBe(true);
});