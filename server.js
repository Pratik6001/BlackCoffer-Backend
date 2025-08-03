const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectToMongoDB = require("./config/db");
const dataRoutes = require("./routes/dashboardroutes");
connectToMongoDB();
const app = express();
const PORT = process.env.SERVER_PORT || 4000;
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/data", dataRoutes);

app.get("/", (req, res) => {
  res.send("Server is runing.... on port ", PORT);
});

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
