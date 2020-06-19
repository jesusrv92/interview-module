import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import './libs/getMediaElement.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import adapter from 'webrtc-adapter'

console.log(adapter.browserDetails.browser);
console.log(adapter.browserDetails.version);

if (process.env.NODE_ENV !== 'production') {
  const {whyDidYouUpdate} = require('why-did-you-update');
  whyDidYouUpdate(React);
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
