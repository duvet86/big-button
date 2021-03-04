import React, { useState } from "react";
import { handleResponse } from "./../utils/http";

export default function LoginContainer() {
  const [loginName, setLoginName] = useState("");

  function handleNameInput(event: React.FormEvent<HTMLInputElement>) {
    event.preventDefault();

    setLoginName(event.currentTarget.value);
  }

  function submit(
    event:
      | React.MouseEvent<HTMLButtonElement>
      | React.ChangeEvent<HTMLInputElement>
  ) {
    // submit ws request
    event.preventDefault();

    fetch("http://localhost:8080/login", {
      method: "POST",
      mode: "cors",
      credentials: "include",
    })
      .then(handleResponse)
      //   .then(setMessage)
      .catch((err) => {
        // setMessage(err.message);
      });
  }

  return (
    <article>
      <input
        type="text"
        value={loginName}
        onInput={handleNameInput}
        onChange={submit}
      />

      <button onClick={submit}>Submit</button>
    </article>
  );
}
