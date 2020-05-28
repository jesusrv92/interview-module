export default function scaleVideos() {
    let videos = document.querySelectorAll('video'),
        length = videos.length, video;

    let minus = 130;
    let windowHeight = 700;
    let windowWidth = 600;
    let windowAspectRatio = windowWidth / windowHeight;
    let videoAspectRatio = 4 / 3;
    let blockAspectRatio;
    let tempVideoWidth = 0;
    let maxVideoWidth = 0;

    for (let i = length; i > 0; i--) {
        blockAspectRatio = i * videoAspectRatio / Math.ceil(length / i);
        if (blockAspectRatio <= windowAspectRatio) {
            tempVideoWidth = videoAspectRatio * windowHeight / Math.ceil(length / i);
        } else {
            tempVideoWidth = windowWidth / i;
        }
        if (tempVideoWidth > maxVideoWidth)
            maxVideoWidth = tempVideoWidth;
    }
    for (let i = 0; i < length; i++) {
        video = videos[i];
        if (video)
            video.width = maxVideoWidth - minus;
    }
}