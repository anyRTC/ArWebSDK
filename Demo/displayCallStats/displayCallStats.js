var client; // ArRTC client
var localTracks = {
  videoTrack: null,
  audioTrack: null
};
var remoteUsers = {};
// ArRTC client options
var options = { 
  appid: null,
  channel: null,
  uid: null,
  token: null
};

let statsInterval;

// the demo can auto join channel with params in url
$(() => {
  var urlParams = new URL(location.href).searchParams;
  options.appid = urlParams.get("appid");
  options.channel = urlParams.get("channel");
  options.uid = urlParams.get("uid");
  options.token = urlParams.get("token");
  if (options.appid && options.channel) {
    $("#appid").val(options.appid);
    $("#token").val(options.token);
    $("#uid").val(options.uid);
    $("#channel").val(options.channel);
    $("#join-form").submit();
  }
})

$("#join-form").submit(async function (e) {
  e.preventDefault();
  $("#join").attr("disabled", true);
  try {
    options.appid = $("#appid").val();
    options.token = $("#token").val();
    options.channel = $("#channel").val();
    options.uid = $("#uid").val();
    await join();
    if(options.token) {
      $("#success-alert-with-token").css("display", "block");
    } else {
      $("#success-alert a").attr("href", `index.html?appid=${options.appid}&channel=${options.channel}&uid=${options.uid}&token=${options.token}`);
      $("#success-alert").css("display", "block");
    }
  } catch (error) {
    console.error(error);
  } finally {
    $("#leave").attr("disabled", false);
  }
})

$("#leave").click(function (e) {
  leave();
})

async function join() {
  // create ArRTC client
  client = ArRTC.createClient({ mode: "rtc", codec: "h264" });

  // add event listener to play remote tracks when remote user publishs.
  client.on("user-published", handleUserPublished);
  client.on("user-unpublished", handleUserUnpublished);

  // join a channel and create local tracks, we can use Promise.all to run them concurrently
  [ options.uid, localTracks.audioTrack, localTracks.videoTrack ] = await Promise.all([
    // join the channel
    client.join(options.appid, options.channel, options.token || null, options.uid),
    // create local tracks, using microphone and camera
    ArRTC.createMicrophoneAudioTrack(),
    ArRTC.createCameraVideoTrack()
  ]);
  
  // play local video track
  localTracks.videoTrack.play("local-player");
  $("#local-player-name").text(`localVideo(${options.uid})`);

  // publish local tracks to channel
  await client.publish(Object.values(localTracks));
  console.log("publish success");

  initStats();
}

async function leave() {
  for (trackName in localTracks) {
    var track = localTracks[trackName];
    if(track) {
      track.stop();
      track.close();
      localTracks[trackName] = undefined;
    }
  }

  destructStats();

  // remove remote users and player views
  remoteUsers = {};
  $("#remote-playerlist").html("");

  // leave the channel
  await client.leave();

  $("#local-player-name").text("");
  $("#join").attr("disabled", false);
  $("#leave").attr("disabled", true);
  console.log("client leaves channel success");
}

async function subscribe(user, mediaType) {
  const uid = user.uid;
  // subscribe to a remote user
  await client.subscribe(user, mediaType);
  console.log("subscribe success");
  if (mediaType === "video") {
    const player = $(`
      <div id="player-wrapper-${uid}">
        <p class="player-name">remoteUser(${uid})</p>
        <div class="player-with-stats">
          <div id="player-${uid}" class="player"></div>
          <div class="track-stats stats"></div>
        </div>
      </div>
    `);
    $("#remote-playerlist").append(player);
    user.videoTrack.play(`player-${uid}`);
  }
  if (mediaType === "audio") {
    user.audioTrack.play();
  }
}

function handleUserPublished(user, mediaType) {
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

function handleUserUnpublished(user) {
  const id = user.uid;
  delete remoteUsers[id];
  $(`#player-wrapper-${id}`).remove();
}

// start collect and show stats information
function initStats() {
  statsInterval = setInterval(flushStats, 1000);
}

// stop collect and show stats information
function destructStats() {
  clearInterval(statsInterval);
  $("#session-stats").html("");
  $("#transport-stats").html("");
  $("#local-stats").html("");
}

// flush stats views
function flushStats() {
  // get the client stats message
  const clientStats = client.getRTCStats();
  const clientStatsList = [
    { description: "Number of users in channel", value: clientStats.UserCount, unit: "" },
    { description: "Duration in channel", value: clientStats.Duration, unit: "s" },
    { description: "Bit rate receiving", value:clientStats.RecvBitrate, unit: "bps" },
    { description: "Bit rate being sent", value:clientStats.SendBitrate, unit: "bps" },
    { description: "Total bytes received", value:clientStats.RecvBytes, unit: "bytes" },
    { description: "Total bytes sent", value:clientStats.SendBytes, unit: "bytes" },
    { description: "Outgoing available bandwidth", value: clientStats.OutgoingAvailableBandwidth.toFixed(3), unit: "kbps" },
    { description: "RTT from SDK to SD-RTN access node", value: clientStats.RTT, unit: "ms" },
  ]
  $("#client-stats").html(`
    ${clientStatsList.map(stat => `<p class="stats-row">${stat.description}: ${stat.value} ${stat.unit}</p>`).join("")}
  `)

  // get the local track stats message
  const localStats = { video: client.getLocalVideoStats(), audio: client.getLocalAudioStats() };
  const localStatsList = [
    { description: "Send audio bit rate", value: localStats.audio.sendBitrate, unit: "bps" },
    { description: "Total audio bytes sent", value: localStats.audio.sendBytes, unit: "bytes" },
    { description: "Total audio packets sent", value: localStats.audio.sendPackets, unit: "" },
    { description: "Total audio packets loss", value: localStats.audio.sendPacketsLost, unit: "" },
    { description: "Video capture resolution height", value: localStats.video.captureResolutionHeight, unit: "" },
    { description: "Video capture resolution width", value: localStats.video.captureResolutionWidth, unit: "" },
    { description: "Video send resolution height", value: localStats.video.sendResolutionHeight, unit: "" },
    { description: "Video send resolution width", value: localStats.video.sendResolutionWidth, unit: "" },
    { description: "video encode delay", value: Number(localStats.video.encodeDelay).toFixed(2), unit: "ms" },
    { description: "Send video bit rate", value: localStats.video.sendBitrate, unit: "bps" },
    { description: "Total video bytes sent", value: localStats.video.sendBytes, unit: "bytes" },
    { description: "Total video packets sent", value: localStats.video.sendPackets, unit: "" },
    { description: "Total video packets loss", value: localStats.video.sendPacketsLost, unit: "" },
    { description: "Video duration", value: localStats.video.totalDuration, unit: "s" },
    { description: "Total video freeze time", value: localStats.video.totalFreezeTime, unit: "s" },
  ];
  $("#local-stats").html(`
    ${localStatsList.map(stat => `<p class="stats-row">${stat.description}: ${stat.value} ${stat.unit}</p>`).join("")}
  `);
  
    const remoteTracksStats = { video: client.getRemoteVideoStats(), audio: client.getRemoteAudioStats() };
    
    Object.keys(remoteUsers).forEach(uid => {
        const remoteTracksStatsList = [
            { description: "Delay of audio from sending to receiving", value: Number(remoteTracksStats.audio[uid].receiveDelay).toFixed(2), unit: "ms" },
            { description: "Delay of video from sending to receiving", value: Number(remoteTracksStats.video[uid].receiveDelay).toFixed(2), unit: "ms" },
            { description: "Total audio bytes received", value: remoteTracksStats.audio[uid].receiveBytes, unit: "bytes" },
            { description: "Total audio packets received", value: remoteTracksStats.audio[uid].receivePackets, unit: "" },
            { description: "Total audio packets loss", value: remoteTracksStats.audio[uid].receivePacketsLost, unit: "" },
            { description: "Total audio packets loss rate", value: Number(remoteTracksStats.audio[uid].packetLossRate).toFixed(3), unit: "%" },
            { description: "Video received resolution height", value: remoteTracksStats.video[uid].receiveResolutionHeight, unit: "" },
            { description: "Video received resolution width", value: remoteTracksStats.video[uid].receiveResolutionWidth, unit: "" },
            { description: "Receiving video bit rate", value: remoteTracksStats.video[uid].receiveBitrate, unit: "bps" },
            { description: "Total video bytes received", value: remoteTracksStats.video[uid].receiveBytes, unit: "bytes" },
            { description: "Total video packets received", value: remoteTracksStats.video[uid].receivePackets, unit: "" },
            { description: "Total video packets loss", value: remoteTracksStats.video[uid].receivePacketsLost, unit: "" },
            { description: "Total video packets loss rate", value: Number(remoteTracksStats.video[uid].receivePacketsLost).toFixed(3), unit: "%" },
            { description: "Video duration", value: remoteTracksStats.video[uid].totalDuration, unit: "s" },
            { description: "Total video freeze time", value: remoteTracksStats.video[uid].totalFreezeTime, unit: "s" },
            { description: "video freeze rate", value: Number(remoteTracksStats.video[uid].freezeRate).toFixed(3), unit: "%" },
        ];
        $(`#player-wrapper-${uid} .track-stats`).html(`
            ${remoteTracksStatsList.map(stat => `<p class="stats-row">${stat.description}: ${stat.value} ${stat.unit}</p>`).join("")}
        `);
    });
}