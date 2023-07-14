var client; // client
var localTracks = {
  videoTrack: null,
  audioTrack: null
};
var remoteUsers = {};
var relayChannelConfiguration = null;
// ArRTC client options
var options = {
  appid: null,
  channel: null,
  uid: null,
  token: null
};

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
    options.uid = $("#uid").val();
    options.channel = $("#channel").val();
    await join();
    if(options.token) {
      $("#success-alert-with-token").css("display", "block");
    } else {
      $("#success-alert a").attr("href", `index.html?appid=${options.appid}&channel=${options.channel}&uid=${options.uid}&token=${options.token}`);
      $("#success-alert").css("display", "block");
    }
    $("#start").attr("disabled", false);
    $("#stop").attr("disabled", true);
  } catch (error) {
    console.error(error);
  } finally {
    $("#leave").attr("disabled", false);
  }
})

$("#leave").click(function (e) {
  leave();
})

$("#start").click(async function (e) {
  if ("" === $("#relayChannel").val()) return;
  try {
    var targetChannel = $("#relayChannel").val();
    relayChannelConfiguration = ArRTC.createChannelMediaRelayConfiguration();
    relayChannelConfiguration.setSrcChannelInfo({ channelName: options.channel, token: options.token, uid: options.uid });
    relayChannelConfiguration.addDestChannelInfo({ channelName: targetChannel, token: options.token, uid: options.uid });
    await client.startChannelMediaRelay(relayChannelConfiguration);

    $("#start").attr("disabled", true);
    $("#stop").attr("disabled", false);
  } catch (err) {
    throw err;
  }
});

$("#stop").click(async function (e) {
  if (relayChannelConfiguration) {
    await client.stopChannelMediaRelay(relayChannelConfiguration);
    $("#start").attr("disabled", false);
    $("#stop").attr("disabled", true);
  }
})

async function join() {
  try {
    // create ArRTC client
    client = ArRTC.createClient({ mode: "rtc", codec: "h264" });
    client.on("channel-media-relay-event", (event) => {
      console.log("channel-media-relay-event", event);
    });
    client.on("channel-media-relay-state", (state, code) => {
      console.log("channel-media-relay-state", state, code);
    });
    client.on("connection-state-change", (curState, revState, reason) => {
      console.log("connection-state-change", curState, revState, reason);
    });
    // add event listener to play remote tracks when remote user publishs.
    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);

    // join a channel and create local tracks, we can use Promise.all to run them concurrently
    [ options.uid, [localTracks.audioTrack, localTracks.videoTrack] ] = await Promise.all([
      // join the channel
      client.join(options.appid, options.channel, options.token || null, options.uid),
      // create local tracks, using microphone and camera
      ArRTC.createMicrophoneAndCameraTracks(
        {
          encoderConfig: null
        },
        {
          encoderConfig: null
        }
      ),
    ]);
    
    // play local video track
    localTracks.videoTrack.play("local-player");
    $("#local-player-name").text(`localVideo(${options.uid})`);

    // publish local tracks to channel
    await client.publish(Object.values(localTracks));
  } catch(err) {
    throw err;
  }
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
  if (mediaType === 'video') {
    const player = $(`
      <div id="player-wrapper-${uid}">
        <p class="player-name">remoteUser(${uid})</p>
        <div id="player-${uid}" class="player"></div>
      </div>
    `);
    $("#remote-playerlist").append(player);
    user.videoTrack.play(`player-${uid}`);
  }
  if (mediaType === 'audio') {
    user.audioTrack.play();
  }
}

function handleUserPublished(user, mediaType) {
  console.log("user-published", user, mediaType);
  const id = user.uid;
  remoteUsers[id] = user;
  subscribe(user, mediaType);
}

function handleUserUnpublished(user, mediaType) {
  console.log("user-unpublished", user, mediaType);
  const id = user.uid;
  delete remoteUsers[id];
  $(`#player-wrapper-${id}`).remove();
}