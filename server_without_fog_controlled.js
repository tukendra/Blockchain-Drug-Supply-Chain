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
  url: "http://127.0.0.1:5001",
});

// ======================================================
// PERFORMANCE FILES
// ======================================================

const recordsFile = path.join(
  __dirname,
  "records_without_fog_controlled.txt"
);

const metricsFile = path.join(
  __dirname,
  "performance_metrics_without_fog_controlled.json"
);

// ======================================================
// SERVER PERFORMANCE VARIABLES
// ======================================================

let totalTransactions = 0;
let successfulTransactions = 0;
let failedTransactions = 0;

const serverStartTime = performance.now();

// ======================================================
// CONTROLLED BENCHMARK STATE
// ======================================================

let activeBenchmark = null;

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
    console.error(
      "Error reading performance_metrics_without_fog_controlled.json:",
      error
    );

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
    console.error(
      "Error writing performance_metrics_without_fog_controlled.json:",
      error
    );
  }
}

// ======================================================
// HELPER: CALCULATE CUMULATIVE THROUGHPUT
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
// HELPER: APPEND TO RECORDS FILE
// ======================================================

function appendRecord(record) {
  const log =
    `Timestamp: ${record.timestamp} | ` +
    `Architecture: ${record.architecture} | ` +
    `Benchmark ID: ${record.benchmarkId || "NONE"} | ` +
    `TxHash: ${record.txHash} | ` +
    `CID: ${record.cid} | ` +
    `Latency: ${record.endToEndLatencyMs} ms | ` +
    `IPFS Storage Time: ${record.ipfsStorageTimeMs} ms | ` +
    `Throughput: ${record.throughputTPS} TPS | ` +
    `Status: ${record.status}\n`;

  fs.appendFile(recordsFile, log, (err) => {
    if (err) {
      console.error(
        "Error writing records_without_fog_controlled.txt:",
        err
      );
    }
  });
}

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {
  res.json({
    status: "running",
    service:
      "Drug Supply Chain Baseline Server (Without Fog) - Controlled",
    architecture: "WITHOUT_FOG",
    port: PORT,
    ipfsAPI: "http://127.0.0.1:5001",
  });
});

// ======================================================
// PERFORMANCE SUMMARY ENDPOINT
// ======================================================

app.get("/metrics", (req, res) => {
  const metrics = readMetrics();

  let benchmark = null;

  if (activeBenchmark) {
    benchmark = {
      benchmarkId: activeBenchmark.benchmarkId,
      architecture: "WITHOUT_FOG",
      startedAt: activeBenchmark.startedAt,
      completedTransactions:
        successfulTransactions -
        activeBenchmark.startingSuccessfulTransactions,
      failedTransactions:
        failedTransactions -
        activeBenchmark.startingFailedTransactions,
    };
  }

  res.json({
    architecture: "WITHOUT_FOG",
    totalTransactions,
    successfulTransactions,
    failedTransactions,
    throughputTPS: calculateThroughput(),
    benchmark,
    records: metrics,
  });
});

// ======================================================
// CONTROLLED BENCHMARK START
// ======================================================

app.post("/benchmark/start", (req, res) => {
  if (activeBenchmark) {
    return res.status(409).json({
      success: false,
      error: "A benchmark is already running.",
      benchmarkId: activeBenchmark.benchmarkId,
    });
  }

  const benchmarkId =
    req.body?.benchmarkId ||
    `NOFOG_CONTROLLED_TEST_${Date.now()}`;

  activeBenchmark = {
    benchmarkId,
    architecture: "WITHOUT_FOG",
    startedAt: new Date().toISOString(),
    startPerformance: performance.now(),
    startingSuccessfulTransactions:
      successfulTransactions,
    startingFailedTransactions:
      failedTransactions,
  };

  console.log("\n======================================");
  console.log("CONTROLLED BENCHMARK STARTED");
  console.log("Benchmark ID:", benchmarkId);
  console.log("Architecture: WITHOUT FOG");
  console.log(
    "Starting successful transactions:",
    successfulTransactions
  );
  console.log("======================================\n");

  return res.json({
    success: true,
    benchmarkId,
    architecture: "WITHOUT_FOG",
    startedAt: activeBenchmark.startedAt,
    startingSuccessfulTransactions:
      activeBenchmark.startingSuccessfulTransactions,
  });
});

// ======================================================
// CONTROLLED BENCHMARK END
// ======================================================

app.post("/benchmark/end", (req, res) => {
  if (!activeBenchmark) {
    return res.status(400).json({
      success: false,
      error: "No active benchmark is running.",
    });
  }

  const endedAt = new Date().toISOString();

  const elapsedSeconds =
    (performance.now() -
      activeBenchmark.startPerformance) /
    1000;

  const completedTransactions =
    successfulTransactions -
    activeBenchmark.startingSuccessfulTransactions;

  const failedInBenchmark =
    failedTransactions -
    activeBenchmark.startingFailedTransactions;

  const throughputTPS =
    elapsedSeconds > 0
      ? Number(
          (
            completedTransactions /
            elapsedSeconds
          ).toFixed(4)
        )
      : 0;

  const result = {
    success: true,
    benchmarkId: activeBenchmark.benchmarkId,
    architecture: "WITHOUT_FOG",

    completedTransactions,

    failedTransactions: failedInBenchmark,

    elapsedSeconds: Number(
      elapsedSeconds.toFixed(3)
    ),

    throughputTPS,

    startedAt: activeBenchmark.startedAt,

    endedAt,
  };

  console.log("\n======================================");
  console.log("BENCHMARK COMPLETE");
  console.log("Benchmark ID:", result.benchmarkId);
  console.log("Architecture:", result.architecture);
  console.log("Completed:", result.completedTransactions);
  console.log("Failed:", result.failedTransactions);
  console.log(
    "Elapsed:",
    result.elapsedSeconds,
    "seconds"
  );
  console.log(
    "Controlled TPS:",
    result.throughputTPS
  );
  console.log("======================================\n");

  activeBenchmark = null;

  return res.json(result);
});

// ======================================================
// BASELINE:
// BLOCKCHAIN TRANSACTION HASH → IPFS
// WITHOUT FOG / EDGE PROCESSING
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
        error: "Transaction hash is required.",
      });
    }

    console.log(
      "\n======================================"
    );

    console.log(
      "New controlled baseline transaction received"
    );

    console.log(
      "Architecture: WITHOUT FOG"
    );

    console.log(
      "Transaction Hash:",
      txHash
    );

    console.log(
      "Benchmark ID:",
      activeBenchmark?.benchmarkId ||
        "NONE"
    );

    console.log(
      "======================================"
    );

    // --------------------------------------------------
    // PREPARE TRANSACTION DATA
    // --------------------------------------------------

    const transactionData = JSON.stringify({
      txHash: txHash,

      receivedAt: timestamp,

      architecture: "WITHOUT_FOG",

      benchmarkId:
        activeBenchmark?.benchmarkId ||
        null,

      entity:
        req.body.entity ||
        "Unknown",

      operation:
        req.body.operation ||
        "Unknown",
    });

    // --------------------------------------------------
    // IPFS STORAGE START
    // --------------------------------------------------

    const ipfsStart = performance.now();

    const result =
      await ipfs.add(transactionData);

    const ipfsEnd = performance.now();

    // --------------------------------------------------
    // IPFS STORAGE TIME
    // --------------------------------------------------

    const ipfsStorageTimeMs =
      Number(
        (
          ipfsEnd -
          ipfsStart
        ).toFixed(3)
      );

    const cid =
      result.cid.toString();

    console.log(
      "IPFS CID:",
      cid
    );

    console.log(
      "IPFS Storage Time:",
      ipfsStorageTimeMs,
      "ms"
    );

    // --------------------------------------------------
    // END-TO-END LATENCY
    // --------------------------------------------------

    const requestEnd =
      performance.now();

    const endToEndLatencyMs =
      Number(
        (
          requestEnd -
          requestStart
        ).toFixed(3)
      );

    // --------------------------------------------------
    // SUCCESS COUNTER
    // --------------------------------------------------

    successfulTransactions++;

    // --------------------------------------------------
    // CUMULATIVE THROUGHPUT
    // --------------------------------------------------

    const throughputTPS =
      calculateThroughput();

    // --------------------------------------------------
    // CONTROLLED BENCHMARK METADATA
    // --------------------------------------------------

    const benchmarkId =
      activeBenchmark?.benchmarkId ||
      null;

    // --------------------------------------------------
    // PERFORMANCE RECORD
    // --------------------------------------------------

    const record = {
      timestamp,

      transactionNumber:
        successfulTransactions,

      architecture:
        "WITHOUT_FOG",

      benchmarkId,

      benchmarkActive:
        Boolean(activeBenchmark),

      entity:
        req.body.entity ||
        "Unknown",

      operation:
        req.body.operation ||
        "Unknown",

      txHash,

      cid,

      status:
        "SUCCESS",

      endToEndLatencyMs,

      ipfsStorageTimeMs,

      throughputTPS,
    };

    // --------------------------------------------------
    // SAVE PERFORMANCE METRICS
    // --------------------------------------------------

    const metrics =
      readMetrics();

    metrics.push(record);

    writeMetrics(metrics);

    // --------------------------------------------------
    // SAVE HUMAN-READABLE RECORD
    // --------------------------------------------------

    appendRecord(record);

    // --------------------------------------------------
    // CONSOLE OUTPUT
    // --------------------------------------------------

    console.log(
      "\n---------- BASELINE PERFORMANCE ----------"
    );

    console.log(
      "Architecture:",
      "WITHOUT FOG"
    );

    console.log(
      "Benchmark ID:",
      benchmarkId || "NONE"
    );

    console.log(
      "Entity:",
      record.entity
    );

    console.log(
      "Operation:",
      record.operation
    );

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
      "Cumulative Throughput:",
      throughputTPS,
      "TPS"
    );

    console.log(
      "-------------------------------------------\n"
    );

    // --------------------------------------------------
    // RESPONSE TO CONTROLLED WORKLOAD GENERATOR
    // --------------------------------------------------

    return res.json({
      success: true,

      architecture:
        "WITHOUT_FOG",

      benchmarkId,

      txHash,

      cid,

      metrics: {
        latencyMs:
          endToEndLatencyMs,

        ipfsStorageTimeMs,

        throughputTPS,
      },
    });

  } catch (error) {

    failedTransactions++;

    const requestEnd =
      performance.now();

    const latencyMs =
      Number(
        (
          requestEnd -
          requestStart
        ).toFixed(3)
      );

    console.error(
      "\n======================================"
    );

    console.error(
      "ERROR PROCESSING BASELINE TRANSACTION"
    );

    console.error(error);

    console.error(
      "======================================\n"
    );

    // --------------------------------------------------
    // SAVE FAILED TRANSACTION
    // --------------------------------------------------

    const failedRecord = {

      timestamp,

      transactionNumber:
        totalTransactions,

      architecture:
        "WITHOUT_FOG",

      benchmarkId:
        activeBenchmark?.benchmarkId ||
        null,

      benchmarkActive:
        Boolean(activeBenchmark),

      entity:
        req.body?.entity ||
        "Unknown",

      operation:
        req.body?.operation ||
        "Unknown",

      txHash:
        req.body?.txHash ||
        null,

      cid:
        null,

      status:
        "FAILED",

      endToEndLatencyMs:
        latencyMs,

      ipfsStorageTimeMs:
        null,

      throughputTPS:
        calculateThroughput(),

      error:
        error.message,
    };

    const metrics =
      readMetrics();

    metrics.push(
      failedRecord
    );

    writeMetrics(metrics);

    return res.status(500).json({

      success: false,

      architecture:
        "WITHOUT_FOG",

      benchmarkId:
        activeBenchmark?.benchmarkId ||
        null,

      error:
        error.message,

      metrics: {

        latencyMs:
          latencyMs,

        ipfsStorageTimeMs:
          null,

        throughputTPS:
          calculateThroughput(),
      },
    });
  }
});

// ======================================================
// START BASELINE SERVER
// ======================================================

app.listen(PORT, () => {

  console.log(
    "======================================"
  );

  console.log(
    "Drug Supply Chain Baseline Server"
  );

  console.log(
    "Controlled Benchmark Version"
  );

  console.log(
    "Architecture: WITHOUT FOG / EDGE"
  );

  console.log(
    "======================================"
  );

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

  console.log(
    "Benchmark endpoints:"
  );

  console.log(
    "POST http://localhost:4000/benchmark/start"
  );

  console.log(
    "POST http://localhost:4000/benchmark/end"
  );

  console.log(
    "======================================"
  );
});