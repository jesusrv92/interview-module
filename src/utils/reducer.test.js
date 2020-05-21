import reducer from './reducer';
import initialState from './initialState'
import { SETINVITED } from './actions'

describe('Reducer test', () => {
    const state = reducer(initialState);

    test('Should return initialState', () => {
        expect(state).toMatchObject(initialState);
    });

    const modifiedState = reducer(state, { type: SETINVITED });

    test('Should update given state', () => {
        expect(state.invited).toBe(false);
        expect(modifiedState.invited).toBe(true);
    });

    test('Returned state should be different than given state', () => {
        expect(state).not.toBe(modifiedState);
    });

    test('Should return current state if action invalid or missing', () => {
        const unmodifiedState = reducer(state, { type: '' })
        expect(unmodifiedState).toBe(state);
    });
});