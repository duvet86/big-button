import React, { useState } from "react";
import { handleResponse } from "./../utils/http";

export default function LoginContainer() {
  const [loginName, setLoginName] = useState("");

  function handleNameInput(event: React.FormEvent<HTMLInputElement>) {
    event.preventDefault();

    setLoginName(event.currentTarget.value);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    // submit ws request
    event.preventDefault();

    fetch("http://localhost:8080/login", {
      method: "POST",
      mode: "cors",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: loginName,
      }),
    })
      .then(handleResponse)
      //   .then(setMessage)
      .catch((err) => {
        // setMessage(err.message);
      });
  }

  return (
    <form onSubmit={submit}>
      <input type="text" value={loginName} onInput={handleNameInput} />

      <button type="submit">Submit</button>
    </form>
  );
}
