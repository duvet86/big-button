import path from "path";
import http from "http";
import session from "express-session";
import cors from "cors";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";

interface Player {
  id: string;
  username: string;
}

// Declaration merging.
declare module "express-session" {
  // eslint-disable-next-line no-unused-vars
  interface SessionData {
    userId?: string;
  }
}

interface IncomingMessage extends http.IncomingMessage {
  session: session.SessionData;
}

const PORT = process.env.PORT || "8080";
const app = express();
const map = new Map<string, WebSocket>();
const players = new Map<string, Player>();

let interval: NodeJS.Timeout;
let timer = 4;

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
    origin:
      process.env.NODE_ENV === "production"
        ? `http://localhost:${PORT}`
        : "http://localhost:3000",
    credentials: true,
  })
);
app.use(sessionParser);
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, "../../client/build")));

app.post("/login", (req, res) => {
  //
  // "Log in" user and set userId to session.
  //
  const id = uuidv4();

  console.log(`Session Id: ${req.session.id}`);
  console.log(`Updating session for user ${id}`);

  req.session.userId = id;

  players.set(id, {
    id,
    username: req.body.username,
  });

  res.send({ result: "OK", userId: id });
});

app.get("/test", (req, res) => {
  console.log(`Session Id: ${req.session.id}`);
  console.log(`User id: ${req.session.userId}`);

  res.send({ result: "OK", message: req.session.userId });
});

app.delete("/logout", (request, response) => {
  if (request.session.userId == null) {
    throw new Error();
  }

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

  sessionParser(request, <never>{}, () => {
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
  if (userId == null) {
    throw new Error();
  }

  map.set(userId, ws);

  ws.send("Ready to play?");

  ws.on("message", (message: string) => {
    const player = players.get(message);
    if (player == null) {
      throw new Error();
    }

    if (timer === 0) {
      ws.send("YOU WIN!");
      timer = 4;
      clearInterval(interval);
      return;
    }

    if (players.size > 1) {
      interval = setInterval(() => {
        timer--;

        map.forEach((userWs) => {
          userWs.send(timer);
        });

        if (timer === 0) {
          clearInterval(interval);
        }
      }, 1000);
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
