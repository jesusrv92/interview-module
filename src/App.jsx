import React from 'react';
import Clipboard from 'react-clipboard.js'

function App() {
    // This checks if someone came from the main link
    // or came through an invitation link
    const [invited, setInvited] = React.useState(false);
    // This checks if a call has been initiated
    const [onCall, setOnCall] = React.useState(false);

    return (
        <article>
            <section id="new-conference">
                <div id="conference-input" hidden={invited}>
                    <button id="setup-new-room" className="setup" disabled={onCall}>Setup New Conference</button>
                    <Clipboard id="invitation" className="setup" button-disabled={invited && !onCall}
                        data-clipboard-text={window.location.href}
                    >Copy invitation</Clipboard>
                </div>
                <button id="hang-up" className="setup" disabled={onCall}>Hang Up</button>
            </section>

            {/* list of all available conferencing rooms */}
            <table id="rooms-list"></table>

            {/* local/remote videos container */}
            <div id="videos-container"></div>

            <script src="./app.js"></script>
        </article>
    );
}

export default React.memo(App);
