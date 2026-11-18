const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());

// API routes (mock for now)
app.get("/api/members", (req, res) => {
  res.json([
    { wfcId: "WFC-0001", name: "John Mwakipesile", region: "Dar es Salaam", status: "Hai" },
    { wfcId: "WFC-0002", name: "Anna Shao", region: "Arusha", status: "Hai" },
    { wfcId: "WFC-0003", name: "Peter Mmari", region: "Moshi", status: "Hai" },
    { wfcId: "WFC-0004", name: "Grace Urio", region: "Dar es Salaam", status: "Amesimamishwa" },
  ]);
});

app.get("/api/stats", (req, res) => {
  res.json({
    members: 469,
    monthlyContributions: 4200000,
    activeEvents: 7,
    totalDebt: 1800000,
  });
});

// All other routes serve the frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`WFC Portal running on port ${PORT}`);
});
