export function handleResponse(response: Response) {
  return response.ok
    ? response.json()
    : Promise.reject(new Error("Unexpected response"));
}
