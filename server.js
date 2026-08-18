const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("GoRide Server Working");
});

app.get("/test", (req, res) => {
    res.send("TEST OK");
});

module.exports = app;