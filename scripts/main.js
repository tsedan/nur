function preload() {
  font = loadFont('assets/start.ttf');
}

function setup() {
  const size = getSize();
  createCanvas(size.wid, size.hei);
  frameRate(60);
  textFont(font);
  gameState = 'CONN';

  room = new Room();
  menu = new Alert("Loading...");
  custID = Math.floor(Math.random() * 1000);
  peer = new Peer('nurnunscf'+custID, {key: 'lwjd5qra8257b9'});
  conn = { nodes:[], host:null };
  peerID = null;
  isHost = false;
  peer.on('open', function(id) {
    peerID = id;
    gameState = 'PEER';
    menu = new Select('Nur',['Join','Host']);
	});
  peer.on('connection', function(c) {
    if (conn.nodes.length < 3) {
      conn.nodes.push(c);
    }
    if (conn.nodes.length >= 3) {
      menu.label = "Room Full";
    }
  });
}

function getSize() {
  const screenRatio = windowWidth / windowHeight;
  const aspectRatio = 12 / 7;
  let wid = 12;
  let hei = 7;
  if (screenRatio > aspectRatio) {
		hei = windowHeight;
		wid = (12 * windowHeight) / 7;
	} else {
		wid = windowWidth;
		hei = (7 * windowWidth) / 12;
	}
  return {wid:wid,hei:hei};
}

function keyPressed() {
  if (gameState != 'INGAME') {
    menu.handleKey(keyCode);
  } else {
    room.handleKey(keyCode);
  }
  return false;
}

function draw() {
  if (gameState != 'INGAME') {
    let chosen = menu.checkChosen();
    if (chosen !== false) {
      if (gameState == 'PEER') {
        if (chosen == "host") {
          menu.reset('Map Select',maps);
          isHost = true;
          conn.host = peerID;
          gameState = 'MAP';
        } else if (chosen == "join") {
          menu = new Prompt("Game ID:");
          gameState = 'HOST';
        }
      } else if (gameState == 'MAP') {
        if (conn.nodes.length != 0 && isHost) {
          for (let i = 0; i < conn.nodes.length; i++) {
            conn.nodes[i].send({ begin:[chosen.toLowerCase(), conn.nodes.length, i] });
          }
          room.initialize(chosen, conn, isHost, conn.nodes.length, -1);
          gameState = 'INGAME';
        }
      } else if (gameState == 'HOST') {
        conn.host = peer.connect('nurnunscf' + chosen);
        conn.host.on('open', (id) => {
          menu = new Alert("Awaiting Host");
          gameState = 'MAP';
          conn.host.on('data', function(data) {
            if (data.begin != null) {
              room.initialize(data.begin[0], conn, isHost, data.begin[1], data.begin[2]);
              gameState = 'INGAME';
            }
          });
        });
        menu.label = 'Joining...';
      }
    } else {
      if (gameState == 'MAP') {
        if (isHost) {
          menu.label = "ID" + custID + " " + (conn.nodes.length + 1) + "P";
        }
      }
      menu.draw();
    }
  } else {
    room.update();
    room.draw();
  }
}
