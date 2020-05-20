import React, { useEffect, useRef } from 'react';

// props
// stream: MediaStream object that will be displayed
// defaultmuted: Property to use instead of muted so it doesn't fire an event
function VideoStream(props) {
    const videoRef = useRef(null);
    useEffect(() => {
        const { current: videoElement } = videoRef;
        if (props.defaultmuted) videoElement.setAttribute('muted', '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const { current: videoElement } = videoRef
        videoElement.srcObject = props.stream
    }, [props.stream])

    return (<video {...props} ref={videoRef}
        // ref={video => {
        //     // React doesn't grant direct access to the srcObject property
        //     // We have to use a reference.

        //     if (video.srcObject !== props.stream) video.srcObject = props.stream;
        // }}
        autoPlay playsInline />);
}

export default VideoStream;