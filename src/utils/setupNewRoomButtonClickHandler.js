import captureUserMedia from './captureUserMedia'

export default function setupNewRoomButtonClickHandler(btnSetupNewRoom, conferenceUI, config, videosContainer) {
    btnSetupNewRoom.disabled = true;
    document.getElementById('conference-name').disabled = true;
    captureUserMedia(config,videosContainer, function () {
        conferenceUI.createRoom({
            roomName: (document.getElementById('conference-name') || {}).value || 'Anonymous'
        });
    }, function () {
        btnSetupNewRoom.disabled = document.getElementById('conference-name').disabled = false;
    });
}