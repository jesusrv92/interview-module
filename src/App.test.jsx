import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

Object.defineProperty(window, 'navigator', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    getUserMedia: jest.fn(),
  })),
});

test('Component renders without crashing.', () => {
  render(<App />);
});

test('Opens media without crashing.', async () => {
  const app = render(<App />);
  const openMediaButton = app.getByTestId('open-media');
  openMediaButton.click();
});