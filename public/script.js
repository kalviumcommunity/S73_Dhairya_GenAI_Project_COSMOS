async function askQuestion() {
  const query = document.getElementById("query").value;
  const resDiv = document.getElementById("response");
  resDiv.innerHTML = "⏳ Thinking...";

  const response = await fetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });

  const data = await response.json();
  resDiv.innerHTML = data.answer || "❌ Error: " + data.error;
}
