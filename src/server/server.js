import express from "express";
import routes from "./routes.js";
import path from "path";

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static("public"));
app.use("/api", routes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
