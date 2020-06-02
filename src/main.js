import setupNewRoomButtonClickHandler from './utils/setupNewRoomButtonClickHandler';
import scaleVideos from './utils/scaleVideos';
import config, { videosContainer, btnSetupNewRoom, conferenceUI } from './utils/config'

const { location } = window;

if (!location.hash.replace('#', '').length) {
    location.href = location.href.split('#')[0] + '#' + (Math.random() * 100).toString().replace('.', '');
    location.reload();
}

/* UI specific */

if (btnSetupNewRoom) btnSetupNewRoom.onclick = () => setupNewRoomButtonClickHandler(btnSetupNewRoom, conferenceUI, config, videosContainer);

(function () {
    var uniqueToken = document.getElementById('unique-token');
    if (uniqueToken)
        if (location.hash.length > 2) uniqueToken.parentNode.parentNode.parentNode.innerHTML = '<h2 style="text-align:center;display: block;"><a href="' + location.href + '" target="_blank">Right click to copy & share this private link</a></h2>';
        else uniqueToken.innerHTML = uniqueToken.parentNode.parentNode.href = '#' + (Math.random() * new Date().getTime()).toString(36).toUpperCase().replace(/\./g, '-');
})();

window.onresize = scaleVideos;