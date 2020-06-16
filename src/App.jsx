import React from 'react';

function App() {
    return (
        <article>
            <section id="new-conference">
                <div id="conference-input">
                    <button id="setup-new-room" className="setup">Setup New Conference</button>
                    <button id="invitation" className="invitation setup" disabled> Copy invitation</button>
                </div>
                <button id="hang-up" className="setup" disabled> Hang Up</button>
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
