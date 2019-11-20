import $ from "jquery";
import io from "socket.io-client";

import Client from "../src/Client";

const storage = {
  read: key => JSON.parse(localStorage.getItem(key)),
  write: (key, data) => localStorage.setItem(key, JSON.stringify(data))
};

const client1 = new Client("https://localhost:3000", { storage });
const client2 = new Client("https://localhost:3000", {
  storage,
  io: (...args) => {
    console.log("custom io called with", ...args);
    return io(...args);
  }
});

var $loginPage = $("#loginPage");
var $chatPage = $("#chatPage");
$chatPage.hide();
var socket = io.connect("http://localhost:3000/authentification");
socket.on("message", function(message) {
  alert("Le serveur a un message pour vous : " + message);
});
socket.on("login", function(message) {
  if (message.code != "ok") {
    alert("Le serveur message  : " + JSON.stringify(message));
  } else {
    $loginPage.hide();
    $chatPage.show();
  }
});

// send login to server
$("#login").click(function() {
  socket.emit("login", {
    username: $("#user").val(),
    password: $("#pass").val()
  });
});

// send a text message
$("#text_button").click(function() {
  var $text_message = $("#text").val();
  socket.emit("message", {
    type: "text",
    text: $text_message,
    createdAt: new Date(Date.now()),
    user: {
      _id: "5d7e99878fd8da28d8fdb6c2",
      avatar: "https://botfoot.herokuapp.com/statics/logo.jpg"
    }
  });
  $("#text").val("");
});

// send a video message
$("#video").click(function() {
  socket.emit("message", {
    type: "video",
    text: "My message",
    createdAt: new Date(Date.now()),
    user: {
      _id: "5d7e9100cf41df20704a55cc",
      avatar: "https://botfoot.herokuapp.com/statics/logo.jpg"
    },
    video:
      "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
    // Any additional custom parameters are passed through
  });
});

// send a image message
$("#image").click(function() {
  socket.emit("message", {
    type: "image",
    text: "My message",
    createdAt: new Date(Date.now()),
    user: {
      _id: "5d7e9100cf41df20704a55cc",
      avatar: "https://facebook.github.io/react/img/logo_og.png"
    },
    image: "https://botfoot.herokuapp.com/statics/logo.jpg"
    // Any additional custom parameters are passed through
  });
});

// send a audio message
$("#audio").click(function() {
  socket.emit("message", {
    type: "audio",
    text: "salut serveur comment sava",
    createdAt: new Date(Date.now()),
    user: {
      _id: "5d7e99878fd8da28d8fdb6c2",
      avatar: "https://facebook.github.io/react/img/logo_og.png"
    },
    audio: "https://facebook.github.io/react/img/sound.ovv"
  });
});
