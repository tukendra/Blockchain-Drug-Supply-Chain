import express from "express";
import bodyParser from "body-parser";
import { create } from "ipfs-http-client";

const app = express();
app.use(bodyParser.json());

// Connect to your IPFS Desktop local node
const client = create({ url: "http://127.0.0.1:5001/api/v0" });

// Route: accept txHash from frontend and store in IPFS
app.post("/store", async (req, res) => {
  try {
    const { txHash } = req.body;
    console.log("Received TxHash:", txHash);

    const { cid } = await client.add(txHash);
    console.log("Stored in IPFS:", cid.toString());

    res.json({ cid: cid.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const express = require("express");
const cors = require("cors");

//const app = express();

app.use(cors()); // enable CORS for all routes
app.use(express.json());

app.post("/store", (req, res) => {
  // handle IPFS store logic here
  res.json({ status: "ok" });
});

app.listen(4000, () => console.log("Server running on port 4000"));

app.listen(4000, () => console.log("Fog Node running at http://localhost:4000"));
