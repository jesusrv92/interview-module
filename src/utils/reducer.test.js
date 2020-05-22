import reducer from './reducer';
import initialState from './initialState'
import { SETINVITED } from './actions'

describe('Reducer test', () => {

    const modifiedState = reducer(initialState, { type: SETINVITED });

    test('Should update given state', () => {
        expect(initialState.invited).toBe(false);
        expect(modifiedState.invited).toBe(true);
    });

    test('Returned state should be different than given state', () => {
        expect(initialState).not.toBe(modifiedState);
    });

    test('Should throw error if action invalid or missing', () => {
        expect(() => {
            reducer(initialState, { type: '' })
        }).toThrow();
    });
});