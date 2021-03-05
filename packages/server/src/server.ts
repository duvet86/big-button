import session from "express-session";
import cors from "cors";
import express from "express";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";

interface Player {
  id: string;
  username: string;
  isReady: boolean;
}

// Declaration merging.
declare module "express-session" {
  // eslint-disable-next-line no-unused-vars
  interface SessionData {
    userId?: string;
    username?: string;
    players?: Record<string, Player>;
  }
}

interface IncomingMessage extends http.IncomingMessage {
  session: session.SessionData;
}

const PORT = process.env.PORT || "8080";
const app = express();
const map = new Map();

//
// We need the same instance of the session parser in express and
// WebSocket server.
//
const sessionParser = session({
  saveUninitialized: false,
  secret: "$eCuRiTy",
  resave: false,
});

//
// Serve static files from the 'public' folder.
//
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(sessionParser);
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post("/login", (req, res) => {
  if (req.session.players == null) {
    req.session.players = {};
  }

  //
  // "Log in" user and set userId to session.
  //
  const id = uuidv4();

  // console.log(`Session Id: ${req.session.id}`);
  // console.log(`Updating session for user ${id}`);

  req.session.userId = id;
  req.session.players[id] = {
    id,
    username: req.body.username,
    isReady: false,
  };

  res.send({ result: "OK", username: req.body.username, userId: id });
});

app.get("/test", (req, res) => {
  console.log(`Session Id: ${req.session.id}`);
  console.log(`User id: ${req.session.userId}`);

  res.send({ result: "OK", message: req.session.userId });
});

app.delete("/logout", (request, response) => {
  const ws = map.get(request.session.userId);

  console.log("Destroying session");
  request.session.destroy(() => {
    if (ws) ws.close();

    response.send({ result: "OK", message: "Session destroyed" });
  });
});

//
// Create an HTTP server.
//
const server = http.createServer(app);

//
// Create a WebSocket server completely detached from the HTTP server.
//
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

server.on("upgrade", (request, socket, head) => {
  console.log("Parsing session from request...");

  sessionParser(request, <any>{}, () => {
    if (!request.session.userId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    console.log("Session is parsed!");

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
});

wss.on("connection", (ws, request: IncomingMessage) => {
  const userId = request.session.userId;

  map.set(userId, ws);

  ws.on("message", (id: string) => {
    if (request.session.players == null) {
      throw new Error();
    }

    const player = request.session.players[id];
    if (player == null) {
      throw new Error();
    }
    if (!player.isReady) {
      player.isReady = true;
      request.session.players[id] = player;
      ws.send(
        `User ${player.username} is ready. Total players: ${
          Object.keys(request.session.players).length
        }`
      );
    } else {
      ws.send({
        clickedAt: Date.now(),
      });
    }
  });

  ws.on("close", () => {
    map.delete(userId);
  });
});

//
// Start the server.
//
server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
