import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { create } from "ipfs-http-client";
import { performance } from "perf_hooks";

// ======================================================
// BASIC CONFIGURATION
// ======================================================

const app = express();
const PORT = 4000;

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(bodyParser.json());

// ======================================================
// IPFS CONNECTION
// ======================================================

const ipfs = create({
  url: "http://127.0.0.1:5001"
});

// ======================================================
// PERFORMANCE FILES
// ======================================================

const recordsFile = path.join(__dirname, "records.txt");
const metricsFile = path.join(__dirname, "performance_metrics.json");

// ======================================================
// SERVER PERFORMANCE VARIABLES
// ======================================================

let totalTransactions = 0;
let successfulTransactions = 0;
let failedTransactions = 0;

const serverStartTime = performance.now();

// ======================================================
// INITIALIZE PERFORMANCE FILE
// ======================================================

if (!fs.existsSync(metricsFile)) {
  fs.writeFileSync(metricsFile, "[]", "utf8");
}

// ======================================================
// HELPER: READ EXISTING METRICS
// ======================================================

function readMetrics() {
  try {
    if (!fs.existsSync(metricsFile)) {
      return [];
    }

    const data = fs.readFileSync(metricsFile, "utf8");

    if (!data.trim()) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading performance_metrics.json:", error);
    return [];
  }
}

// ======================================================
// HELPER: WRITE PERFORMANCE METRICS
// ======================================================

function writeMetrics(metrics) {
  try {
    fs.writeFileSync(
      metricsFile,
      JSON.stringify(metrics, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error writing performance_metrics.json:", error);
  }
}

// ======================================================
// HELPER: CALCULATE THROUGHPUT
// ======================================================

function calculateThroughput() {
  const elapsedSeconds =
    (performance.now() - serverStartTime) / 1000;

  if (elapsedSeconds <= 0) {
    return 0;
  }

  return Number(
    (successfulTransactions / elapsedSeconds).toFixed(4)
  );
}

// ======================================================
// HELPER: APPEND TO records.txt
// ======================================================

function appendRecord(record) {
  const log =
    `Timestamp: ${record.timestamp} | ` +
    `TxHash: ${record.txHash} | ` +
    `CID: ${record.cid} | ` +
    `Latency: ${record.endToEndLatencyMs} ms | ` +
    `IPFS Storage Time: ${record.ipfsStorageTimeMs} ms | ` +
    `Fog Processing Time: ${record.fogProcessingTimeMs} ms | ` +
    `Throughput: ${record.throughputTPS} TPS | ` +
    `Status: ${record.status}\n`;

  fs.appendFile(recordsFile, log, (err) => {
    if (err) {
      console.error("Error writing records.txt:", err);
    }
  });
}

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {
  res.json({
    status: "running",
    service: "Drug Supply Chain Fog Server",
    port: PORT,
    ipfsAPI: "http://127.0.0.1:5001"
  });
});

// ======================================================
// PERFORMANCE SUMMARY ENDPOINT
// ======================================================

app.get("/metrics", (req, res) => {
  const metrics = readMetrics();

  res.json({
    totalTransactions,
    successfulTransactions,
    failedTransactions,
    throughputTPS: calculateThroughput(),
    records: metrics
  });
});

// ======================================================
// STORE TRANSACTION HASH IN IPFS
// ======================================================

app.post("/store", async (req, res) => {

  const requestStart = performance.now();
  const timestamp = new Date().toISOString();

  totalTransactions++;

  try {

    // --------------------------------------------------
    // VALIDATE REQUEST
    // --------------------------------------------------

    const { txHash } = req.body;

    if (!txHash || typeof txHash !== "string") {

      failedTransactions++;

      return res.status(400).json({
        success: false,
        error: "Transaction hash is required."
      });
    }

    console.log("\n======================================");
    console.log("New transaction received");
    console.log("Transaction Hash:", txHash);
    console.log("======================================");

    // --------------------------------------------------
    // FOG PROCESSING START
    // --------------------------------------------------

    const fogProcessingStart = performance.now();

    /*
     * Fog processing represents the processing performed
     * by the intermediate fog node before storing the
     * transaction record in IPFS.
     *
     * At present, the processing consists of:
     * - request validation
     * - transaction record preparation
     * - IPFS submission
     */

    // Prepare transaction data
    const transactionData = JSON.stringify({
      txHash: txHash,
      receivedAt: timestamp
    });

    // --------------------------------------------------
    // IPFS STORAGE START
    // --------------------------------------------------

    const ipfsStart = performance.now();

    const result = await ipfs.add(transactionData);

    const ipfsEnd = performance.now();

    // --------------------------------------------------
    // IPFS STORAGE TIME
    // --------------------------------------------------

    const ipfsStorageTimeMs = Number(
      (ipfsEnd - ipfsStart).toFixed(3)
    );

    const cid = result.cid.toString();

    console.log("IPFS CID:", cid);
    console.log(
      "IPFS Storage Time:",
      ipfsStorageTimeMs,
      "ms"
    );

    // --------------------------------------------------
    // FOG PROCESSING END
    // --------------------------------------------------

    const fogProcessingEnd = performance.now();

    const fogProcessingTimeMs = Number(
      (fogProcessingEnd - fogProcessingStart).toFixed(3)
    );

    // --------------------------------------------------
    // END-TO-END LATENCY
    // --------------------------------------------------

    const requestEnd = performance.now();

    const endToEndLatencyMs = Number(
      (requestEnd - requestStart).toFixed(3)
    );

    // --------------------------------------------------
    // SUCCESS COUNTER
    // --------------------------------------------------

    successfulTransactions++;

    // --------------------------------------------------
    // THROUGHPUT
    // --------------------------------------------------

    const throughputTPS = calculateThroughput();

    // --------------------------------------------------
    // PERFORMANCE RECORD
    // --------------------------------------------------

    const record = {
      timestamp: timestamp,

      transactionNumber: successfulTransactions,

      entity: req.body.entity || "Unknown",

      operation: req.body.operation || "Unknown",

      txHash: txHash,

      cid: cid,

      status: "SUCCESS",

      endToEndLatencyMs: endToEndLatencyMs,

      ipfsStorageTimeMs: ipfsStorageTimeMs,

      fogProcessingTimeMs: fogProcessingTimeMs,

      throughputTPS: throughputTPS
    };

    // --------------------------------------------------
    // SAVE PERFORMANCE METRICS
    // --------------------------------------------------

    const metrics = readMetrics();

    metrics.push(record);

    writeMetrics(metrics);

    // --------------------------------------------------
    // SAVE HUMAN-READABLE RECORD
    // --------------------------------------------------

    appendRecord(record);

    // --------------------------------------------------
    // CONSOLE OUTPUT
    // --------------------------------------------------

    console.log("\n---------- PERFORMANCE ----------");

    console.log(
      "End-to-End Latency:",
      endToEndLatencyMs,
      "ms"
    );

    console.log(
      "IPFS Storage Time:",
      ipfsStorageTimeMs,
      "ms"
    );

    console.log(
      "Fog Processing Time:",
      fogProcessingTimeMs,
      "ms"
    );

    console.log(
      "Throughput:",
      throughputTPS,
      "TPS"
    );

    console.log("---------------------------------\n");

    // --------------------------------------------------
    // RESPONSE TO REACT
    // --------------------------------------------------

    return res.json({
      success: true,

      txHash: txHash,

      cid: cid,

      metrics: {
        latencyMs: endToEndLatencyMs,

        ipfsStorageTimeMs: ipfsStorageTimeMs,

        fogProcessingTimeMs: fogProcessingTimeMs,

        throughputTPS: throughputTPS
      }
    });

  } catch (error) {

    failedTransactions++;

    const requestEnd = performance.now();

    const latencyMs = Number(
      (requestEnd - requestStart).toFixed(3)
    );

    console.error("\n======================================");
    console.error("ERROR PROCESSING TRANSACTION");
    console.error(error);
    console.error("======================================\n");

    // --------------------------------------------------
    // SAVE FAILED TRANSACTION
    // --------------------------------------------------

    const failedRecord = {

      timestamp: timestamp,

      transactionNumber: totalTransactions,

      entity: req.body?.entity || "Unknown",

      operation: req.body?.operation || "Unknown",

      txHash: req.body?.txHash || null,

      cid: null,

      status: "FAILED",

      endToEndLatencyMs: latencyMs,

      ipfsStorageTimeMs: null,

      fogProcessingTimeMs: null,

      throughputTPS: calculateThroughput(),

      error: error.message
    };

    const metrics = readMetrics();

    metrics.push(failedRecord);

    writeMetrics(metrics);

    return res.status(500).json({
      success: false,

      error: error.message,

      metrics: {
        latencyMs: latencyMs,

        ipfsStorageTimeMs: null,

        fogProcessingTimeMs: null,

        throughputTPS: calculateThroughput()
      }
    });
  }
});

// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {

  console.log("======================================");
  console.log("Drug Supply Chain Fog Server");
  console.log("======================================");

  console.log(
    `Backend running on http://localhost:${PORT}`
  );

  console.log(
    "IPFS API: http://127.0.0.1:5001"
  );

  console.log(
    "Performance file:",
    metricsFile
  );

  console.log(
    "Records file:",
    recordsFile
  );

  console.log("======================================");
});