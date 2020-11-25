var videoTrack = null;
var fit = "contain"; // cover => 占满屏幕   contain => 居中显示
var playElement = "big";

$("#switch").click(() => {
    if ( videoTrack === null ) {
        alert("未检测到可用的摄像头，请确认后此电脑拥有可用摄像头或已经接入可用的外部摄像头后，刷新页面重试！");
        return;
    };
    playElement === "big" && videoTrack.play("small", { fit });
    playElement === "small" && videoTrack.play("big", { fit });
    playElement = playElement === "big"? "small" : "big";
});

async function init () {
    const Cameras = await ArRTC.getCameras();
    if ( Cameras.length ) {
        const ICameraVideoTrack = await ArRTC.createCameraVideoTrack();
        videoTrack = ICameraVideoTrack;
        videoTrack && videoTrack.play("big", { fit });
    } else {
        alert("未检测到可用的摄像头，请确认后此电脑拥有可用摄像头或已经接入可用的外部摄像头后，刷新页面重试！");
    };
};

init ();