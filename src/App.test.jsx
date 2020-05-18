import React from 'react';
import { isElement } from 'react-dom/test-utils';
import { act, render } from '@testing-library/react';
import App from './App';

Object.defineProperty(window.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn()
  }
})
Object.defineProperty(window, 'MediaStream', {
  value: jest.fn()
});

test('Component renders without crashing.', () => {
  render(<App />);
});

// test('Opens media without crashing.', () => {
  // const app = render(<App />);
  // const openMediaButton = app.getByTestId('open-media');
  // act(() => openMediaButton.click());
// });