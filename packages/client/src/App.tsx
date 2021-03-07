import { useState, useRef, useCallback, useEffect } from "react";

import { handleResponse } from "./utils/http";

const HOST_HTTP =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:8080";

const HOST_WS =
  process.env.NODE_ENV === "production"
    ? `wss://${window.location.hostname}`
    : "ws://localhost:8080";

export default function App() {
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [hasConnected, setHasConnected] = useState(false);
  const [message, setMessage] = useState<string>("");

  const ref = useCallback((inputEl: HTMLInputElement) => {
    if (inputEl == null) {
      return;
    }

    inputRef.current = inputEl;
  }, []);

  useEffect(() => {
    return () => {
      fetch(`${HOST_HTTP}/logout`, {
        method: "DELETE",
        mode: "cors",
        credentials: "include",
      });
    };
  }, []);

  const onLoginClick = () => {
    if (inputRef.current?.value.trim() === "") {
      alert("Choose a name.");
      return;
    }

    fetch(`${HOST_HTTP}/login`, {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: inputRef.current?.value,
      }),
    })
      .then(handleResponse)
      .then((resp: { userId: string }) => {
        if (wsRef.current != null) {
          wsRef.current.onerror = wsRef.current.onopen = wsRef.current.onclose = null;
          wsRef.current.close();
        }

        wsRef.current = new WebSocket(HOST_WS);
        wsRef.current.onerror = function () {
          setMessage("WebSocket error");
        };
        wsRef.current.onopen = function () {
          wsRef.current?.send(resp.userId);
          setHasConnected(true);
        };
        wsRef.current.onclose = function () {
          setMessage("WebSocket connection closed");
          wsRef.current = null;
        };
        wsRef.current.onmessage = function (message) {
          if (message.data === "0") {
            setMessage("GO");
          } else {
            setMessage(message.data);
          }
        };

        setUserId(resp.userId);
      })
      .catch((err) => {
        setMessage(err.message);
      });
  };

  const sendWsMessage = () => {
    if (userId == null) {
      throw new Error();
    }
    if (!wsRef.current) {
      setMessage("No WebSocket connection");
      return;
    }

    wsRef.current.send(userId);
  };

  return (
    <div>
      {!hasConnected ? (
        <div>
          <label htmlFor="username">Username</label>
          <input type="text" id="username" ref={ref}></input>
          <button
            id="login"
            type="button"
            title="Simulate login"
            onClick={onLoginClick}
          >
            Submit
          </button>
        </div>
      ) : (
        <div>
          <div>{message}</div>
          {!["3", "2", "1"].includes(message) && (
            <button
              id="wsSendButton"
              type="button"
              title="Send WebSocket message"
              onClick={sendWsMessage}
            >
              Click Me
            </button>
          )}
        </div>
      )}
    </div>
  );
}
