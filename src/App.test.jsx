import React from 'react';
import { act } from 'react-dom/test-utils'
import { render, wait } from '@testing-library/react';
import App from './App';

describe("Main component testing", () => {
  test('Basic component rendering.', () => {
    const app = render(<App />);
    const appComponent = app.getAllByTestId('main-app')

    expect(appComponent.length).toBe(1);
  });

  test('Should create state when rendering app', () => {
    const mockDispatch = jest.fn();
    React.useReducer = jest.fn((fn, state) => [state, mockDispatch]);

    render(<App />);

    expect(React.useReducer).toBeCalled();
  });

  test('Should call function to open media', async () => {
    Object.defineProperty(window.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn()
      }
    });
    Object.defineProperty(window, 'MediaStream', {
      value: jest.fn()
    });
    const mockDispatch = jest.fn();
    React.useReducer = jest.fn(() => [{}, mockDispatch]);

    const app = render(<App />);
    const openMediaButton = app.getByTestId('open-media');
    await act(async () => {
      openMediaButton.click();
      await wait();
    });

    expect(window.navigator.mediaDevices.getUserMedia).toBeCalled();
    expect(mockDispatch).toBeCalledTimes(2);
    expect(window.MediaStream).toBeCalled();
  });
});