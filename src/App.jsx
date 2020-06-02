import React from 'react';
import './App.css';

import scaleVideos from './utils/scaleVideos';
import config, { conferenceUI } from './utils/config'
import captureUserMedia from './utils/captureUserMedia';

const { location } = window;
window.onresize = scaleVideos;

function App() {

    React.useEffect(() => {
        if (!location.hash.replace('#', '').length) {
            location.href = location.href.split('#')[0] + '#' + (Math.random() * 100).toString().replace('.', '');
            location.reload();
        }
    }, [])
    const setupNewRoomButton = React.useRef();
    const conferenceName = React.useRef();
    const videosContainer = React.useRef();

    return (
        <article>
            <header >
                <section className="experiment">
                    <section>
                        <h2 style={{
                            textAlign: "center",
                            display: "block"
                        }}>
                            <a href={location.href}>Right click to copy & share this private link</a>
                        </h2>

                        <input type="text" ref={conferenceName} id="conference-name" placeholder="Conference Name" />
                        <button id="setup-new-room" ref={setupNewRoomButton} className="setup" onClick={() => {
                            setupNewRoomButton.current.disabled = true;
                            conferenceName.current.disabled = true;
                            captureUserMedia(config, videosContainer.current, () => {
                                conferenceUI.createRoom({
                                    roomName: (conferenceName || {}).value || 'Anonymous'
                                });
                            }, () => {
                                setupNewRoomButton.current.disabled = false;
                                conferenceName.current.disabled = false;
                            })
                        }}>Setup New Conference</button>
                    </section>

                    <table id="rooms-list"></table>

                    <div id="videos-container" ref={videosContainer}></div>
                </section>
            </header>
        </article>
    );
}

export default React.memo(App);
