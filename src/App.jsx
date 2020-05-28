import React from 'react';
import './App.css';

function App() {
    
    return (
        <article>
            <header >
                <section class="experiment">
                    <section>
                        <span>
                            <a href="/" target="_blank"
                                title="Open this link in new tab. Then your conference room will be private!">
                                <code>
                                    <strong id="unique-token">#123456789
                                </strong>
                                </code>
                            </a>
                        </span>

                        <input type="text" id="conference-name" placeholder="Conference Name" />
                        <button id="setup-new-room" class="setup">Setup New Conference</button>
                    </section>

                    <table id="rooms-list"></table>

                    <div id="videos-container"></div>
                </section>
            </header>
        </article>
    );
}

export default React.memo(App);
