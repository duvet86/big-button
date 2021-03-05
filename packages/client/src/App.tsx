import { useState, useRef } from "react";

import { handleResponse } from "./utils/http";

export default function App() {
  const [message, setMessage] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  const onLoginClick = () => {
    fetch("http://localhost:8080/login", {
      method: "POST",
      mode: "cors",
      credentials: "include",
    })
      .then(handleResponse)
      .then(setMessage)
      .catch((err) => {
        setMessage(err.message);
      });
  };

  const onLogoutClick = () => {
    fetch("http://localhost:8080/logout", {
      method: "DELETE",
      mode: "cors",
      credentials: "include",
    })
      .then(handleResponse)
      .then(setMessage)
      .catch(function (err) {
        setMessage(err.message);
      });
  };

  const onTestClick = () => {
    fetch("http://localhost:8080/test", {
      method: "GET",
      mode: "cors",
      credentials: "include",
    })
      .then(handleResponse)
      .then(setMessage)
      .catch(function (err) {
        setMessage(err.message);
      });
  };

  const openWsConnection = () => {
    if (wsRef.current) {
      wsRef.current.onerror = wsRef.current.onopen = wsRef.current.onclose = null;
      wsRef.current.close();
    }

    wsRef.current = new WebSocket("ws://localhost:8080");
    wsRef.current.onerror = function () {
      setMessage("WebSocket error");
    };
    wsRef.current.onopen = function () {
      setMessage("WebSocket connection established");
    };
    wsRef.current.onclose = function () {
      setMessage("WebSocket connection closed");
      wsRef.current = null;
    };
  };

  const sendWsMessage = () => {
    if (!wsRef.current) {
      setMessage("No WebSocket connection");
      return;
    }

    wsRef.current.send("Hello World!");
    setMessage('Sent "Hello World!"');
  };

  return (
    <div>
      <h1>Choose an action.</h1>
      <button
        id="login"
        type="button"
        title="Simulate login"
        onClick={onLoginClick}
      >
        Simulate login
      </button>
      <button
        id="logout"
        type="button"
        title="Simulate logout"
        onClick={onLogoutClick}
      >
        Simulate logout
      </button>
      <button id="test" type="button" title="Test" onClick={onTestClick}>
        Test
      </button>
      <button
        id="wsButton"
        type="button"
        title="Open WebSocket connection"
        onClick={openWsConnection}
      >
        Open WebSocket connection
      </button>
      <button
        id="wsSendButton"
        type="button"
        title="Send WebSocket message"
        onClick={sendWsMessage}
      >
        Send WebSocket message
      </button>
      <pre id="messages" style={{ height: 400, overflow: "scroll" }}>
        {message}
      </pre>
    </div>
  );
}
