import React from 'react';

function VideoStream(props) {
    return (<video {...props} ref={video => {
        // React doesn't grant direct access to the srcObject property
        // We have to use a reference.
        if (video) video.srcObject = props.stream;
    }} autoPlay playsInline />);
}

export default React.memo(VideoStream);
