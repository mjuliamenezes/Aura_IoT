export async function getLatestReading() {
  const response = await fetch("http://127.0.0.1:8000/latest");
  return response.json();
}
