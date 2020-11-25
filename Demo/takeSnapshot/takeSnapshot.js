var videoTrack = null;
var dataUrl = null;
var fit = "contain"; // cover => 占满屏幕   contain => 居中显示
var screenshots = document.getElementsByClassName("screenshots")[0];
var imgBox = document.getElementById("imgBox");

// 截屏
$("#screenshots").click(() => {
    if ( videoTrack === null ) {
        alert("未检测到可用的摄像头，请确认后此电脑拥有可用摄像头或已经接入可用的外部摄像头后，刷新页面重试！");
        return;
    };
    const frameData = videoTrack.getCurrentFrameData();
    const canvas = document.createElement("canvas");
    canvas.width = frameData.width;
    canvas.height = frameData.height;
    const ctx = canvas.getContext("2d");
    ctx.putImageData(frameData, 0, 0);
    dataUrl = canvas.toDataURL();
    imgBox.style.display = "flex";
    screenshots.src = canvas.toDataURL();
});


// 下载
$("#download").click(() => {
    const a = document.createElement("a"); // 生成一个a元素
    const event = new MouseEvent("click"); // 创建一个单击事件
    a.download = "photo"; // 设置图片名称
    a.href = dataUrl; // 将生成的URL设置为a.href属性
    a.dispatchEvent(event); // 触发a的单击事件
});

async function init () {
    const Cameras = await ArRTC.getCameras();
    if ( Cameras.length ) {
        const ICameraVideoTrack = await ArRTC.createCameraVideoTrack();
        videoTrack = ICameraVideoTrack;
        videoTrack && videoTrack.play("player", { fit });
    } else {
        alert("未检测到可用的摄像头，请确认后此电脑拥有可用摄像头或已经接入可用的外部摄像头后，刷新页面重试！");
    };
};

init ();