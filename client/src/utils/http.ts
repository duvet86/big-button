export function handleResponse(response: Response) {
  return response.ok
    ? response.json().then((data) => JSON.stringify(data, null, 2))
    : Promise.reject(new Error("Unexpected response"));
}
