import captureUserMedia from './captureUserMedia'

export default function setupNewRoomButtonClickHandler(btnSetupNewRoom, conferenceUI) {
    btnSetupNewRoom.disabled = true;
    document.getElementById('conference-name').disabled = true;
    captureUserMedia(function () {
        conferenceUI.createRoom({
            roomName: (document.getElementById('conference-name') || {}).value || 'Anonymous'
        });
    }, function () {
        btnSetupNewRoom.disabled = document.getElementById('conference-name').disabled = false;
    });
}