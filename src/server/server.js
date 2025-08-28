const express = require("express");
const routes = require("./routes.js");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static("public"));
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
