import getMediaElement from 'getmediaelement'

export default function captureUserMedia(config, videosContainer, callback, failure_callback) {
    var video = document.createElement('video');
    video.muted = true;
    video.volume = 0;

    try {
        video.setAttributeNode(document.createAttribute('autoplay'));
        video.setAttributeNode(document.createAttribute('playsinline'));
        video.setAttributeNode(document.createAttribute('controls'));
    } catch (e) {
        video.setAttribute('autoplay', true);
        video.setAttribute('playsinline', true);
        video.setAttribute('controls', true);
    }

    navigator.mediaDevices.getUserMedia({
        video: video,
        onsuccess: function (stream) {
            config.attachStream = stream;

            var mediaElement = getMediaElement(video, {
                width: (videosContainer.clientWidth / 2) - 50,
                buttons: ['mute-audio', 'mute-video', 'full-screen', 'volume-slider']
            });
            mediaElement.toggle('mute-audio');
            videosContainer.appendChild(mediaElement);

            callback && callback();
        },
        onerror: function () {
            alert('unable to get access to your webcam');
            callback && callback();
        }
    });
}