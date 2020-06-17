import React from 'react';
import Clipboard from 'react-clipboard.js'

function App() {
    // This checks if someone came from the main link
    // or came through an invitation link
    const [invited, setInvited] = React.useState(false);
    // This checks if a call has been initiated
    const [onCall, setOnCall] = React.useState(false);

    React.useEffect(() => {
        if (!window.location.hash.replace('#', '').length) {
            window.location.href = window.location.href.split('#')[0] + '#' + (Math.random() * 100).toString().replace('.', '');
        }
        else {
            setInvited(true);
        }
    }, [])

    return (
        <article>
            <section id="new-conference">
                <div id="conference-input" hidden={invited}>
                    <button id="setup-new-room" className="setup" disabled={onCall}
                        onClick={() => {
                            setOnCall(true);
                        }}
                    >Setup New Conference</button>
                    <Clipboard id="invitation" className="setup" button-disabled={invited || !onCall}
                        data-clipboard-text={window.location.href}
                    >Copy invitation</Clipboard>
                </div>
                <button id="hang-up" className="setup" disabled={!onCall}
                    onClick={() => {
                        setOnCall(false);
                    }}
                >Hang Up</button>
            </section>

            {/* list of all available conferencing rooms */}
            <table id="rooms-list"></table>

            {/* local/remote videos container */}
            <div id="videos-container"></div>
        </article>
    );
}

export default React.memo(App);
