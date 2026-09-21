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

const recordsFile = path.join(
  __dirname,
  "records_controlled_fog.txt"
);

const metricsFile = path.join(
  __dirname,
  "performance_metrics_controlled_fog.json"
);

// ======================================================
// SERVER PERFORMANCE VARIABLES
// ======================================================

let totalTransactions = 0;
let successfulTransactions = 0;
let failedTransactions = 0;

const serverStartTime = performance.now();

// ======================================================
// CONTROLLED BENCHMARK VARIABLES
// ======================================================

let benchmarkActive = false;
let benchmarkId = null;
let benchmarkStartTime = null;
let benchmarkStartSuccessful = 0;

// ======================================================
// INITIALIZE PERFORMANCE FILE
// ======================================================

if (!fs.existsSync(metricsFile)) {
  fs.writeFileSync(metricsFile, "[]", "utf8");
}

// ======================================================
// HELPER: READ METRICS
// ======================================================

function readMetrics() {
  try {
    if (!fs.existsSync(metricsFile)) {
      return [];
    }

    const data = fs.readFileSync(
      metricsFile,
      "utf8"
    );

    if (!data.trim()) {
      return [];
    }

    return JSON.parse(data);

  } catch (error) {

    console.error(
      "Error reading controlled Fog metrics:",
      error
    );

    return [];
  }
}

// ======================================================
// HELPER: WRITE METRICS
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
      "Error writing controlled Fog metrics:",
      error
    );
  }
}

// ======================================================
// CUMULATIVE SERVER THROUGHPUT
//
// NOTE:
// This value is retained only for monitoring.
// It should NOT be used as the final benchmark TPS.
// ======================================================

function calculateCumulativeThroughput() {

  const elapsedSeconds =
    (performance.now() - serverStartTime) / 1000;

  if (elapsedSeconds <= 0) {
    return 0;
  }

  return Number(
    (
      successfulTransactions /
      elapsedSeconds
    ).toFixed(4)
  );
}

// ======================================================
// CONTROLLED BENCHMARK THROUGHPUT
// ======================================================

function calculateCurrentBenchmarkThroughput() {

  if (
    !benchmarkActive ||
    benchmarkStartTime === null
  ) {
    return null;
  }

  const elapsedSeconds =
    (performance.now() - benchmarkStartTime) / 1000;

  const completedTransactions =
    successfulTransactions -
    benchmarkStartSuccessful;

  if (
    elapsedSeconds <= 0 ||
    completedTransactions <= 0
  ) {
    return 0;
  }

  return Number(
    (
      completedTransactions /
      elapsedSeconds
    ).toFixed(4)
  );
}

// ======================================================
// HELPER: APPEND HUMAN-READABLE RECORD
// ======================================================

function appendRecord(record) {

  const log =
    `Timestamp: ${record.timestamp} | ` +
    `Benchmark ID: ${record.benchmarkId} | ` +
    `TxHash: ${record.txHash} | ` +
    `CID: ${record.cid} | ` +
    `Latency: ${record.endToEndLatencyMs} ms | ` +
    `IPFS Storage Time: ${record.ipfsStorageTimeMs} ms | ` +
    `Fog Processing Time: ${record.fogProcessingTimeMs} ms | ` +
    `Benchmark TPS: ${record.benchmarkThroughputTPS} TPS | ` +
    `Status: ${record.status}\n`;

  fs.appendFile(
    recordsFile,
    log,
    (err) => {

      if (err) {

        console.error(
          "Error writing controlled Fog records:",
          err
        );

      }

    }
  );
}

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {

  res.json({

    status: "running",

    architecture: "WITH_FOG",

    service:
      "Drug Supply Chain Fog Server - Controlled Benchmark",

    port: PORT,

    ipfsAPI:
      "http://127.0.0.1:5001"

  });

});

// ======================================================
// START CONTROLLED BENCHMARK
// ======================================================

app.post(
  "/benchmark/start",
  (req, res) => {

    if (benchmarkActive) {

      return res.status(400).json({

        success: false,

        error:
          "A benchmark is already active.",

        benchmarkId

      });

    }

    benchmarkId =
      req.body?.benchmarkId ||
      `FOG-${Date.now()}`;

    benchmarkActive = true;

    benchmarkStartTime =
      performance.now();

    benchmarkStartSuccessful =
      successfulTransactions;

    console.log(
      "\n======================================"
    );

    console.log(
      "CONTROLLED FOG BENCHMARK STARTED"
    );

    console.log(
      "Benchmark ID:",
      benchmarkId
    );

    console.log(
      "======================================\n"
    );

    return res.json({

      success: true,

      benchmarkId,

      message:
        "Controlled Fog benchmark started.",

      startingSuccessfulTransactions:
        benchmarkStartSuccessful

    });

  }
);

// ======================================================
// END CONTROLLED BENCHMARK
// ======================================================

app.post(
  "/benchmark/end",
  (req, res) => {

    if (
      !benchmarkActive ||
      benchmarkStartTime === null
    ) {

      return res.status(400).json({

        success: false,

        error:
          "No active benchmark session."

      });

    }

    const benchmarkEndTime =
      performance.now();

    const elapsedSeconds =
      (
        benchmarkEndTime -
        benchmarkStartTime
      ) / 1000;

    const completedTransactions =
      successfulTransactions -
      benchmarkStartSuccessful;

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

      benchmarkId,

      architecture:
        "WITH_FOG",

      completedTransactions,

      failedTransactions:
        failedTransactions,

      elapsedSeconds:
        Number(
          elapsedSeconds.toFixed(3)
        ),

      throughputTPS,

      endedAt:
        new Date().toISOString()

    };

    benchmarkActive = false;

    benchmarkStartTime = null;

    console.log(
      "\n======================================"
    );

    console.log(
      "CONTROLLED FOG BENCHMARK FINISHED"
    );

    console.log(
      "Benchmark ID:",
      benchmarkId
    );

    console.log(
      "Completed Transactions:",
      completedTransactions
    );

    console.log(
      "Elapsed Seconds:",
      result.elapsedSeconds
    );

    console.log(
      "Throughput:",
      throughputTPS,
      "TPS"
    );

    console.log(
      "======================================\n"
    );

    return res.json({

      success: true,

      ...result

    });

  }
);

// ======================================================
// PERFORMANCE SUMMARY
// ======================================================

app.get(
  "/metrics",
  (req, res) => {

    const metrics =
      readMetrics();

    res.json({

      totalTransactions,

      successfulTransactions,

      failedTransactions,

      cumulativeThroughputTPS:
        calculateCumulativeThroughput(),

      benchmarkActive,

      benchmarkId,

      currentBenchmarkThroughputTPS:
        calculateCurrentBenchmarkThroughput(),

      records:
        metrics

    });

  }
);

// ======================================================
// STORE TRANSACTION HASH IN IPFS
// ======================================================

app.post(
  "/store",
  async (req, res) => {

    const requestStart =
      performance.now();

    const timestamp =
      new Date().toISOString();

    totalTransactions++;

    let fogProcessingTimeMs = null;

    let ipfsStorageTimeMs = null;

    try {

      // ------------------------------------------------
      // REQUEST VALIDATION
      // ------------------------------------------------

      const { txHash } =
        req.body;

      if (
        !txHash ||
        typeof txHash !== "string"
      ) {

        failedTransactions++;

        return res.status(400).json({

          success: false,

          error:
            "Transaction hash is required."

        });

      }

      console.log(
        "\n======================================"
      );

      console.log(
        "New transaction received"
      );

      console.log(
        "Transaction Hash:",
        txHash
      );

      console.log(
        "======================================"
      );

      // ------------------------------------------------
      // FOG PROCESSING
      //
      // IMPORTANT:
      // This section does NOT include IPFS time.
      // ------------------------------------------------

      const fogProcessingStart =
        performance.now();

      /*
       * Fog processing represents work performed
       * by the intermediate fog layer before IPFS.
       *
       * Current fog-side work:
       * - transaction record preparation
       * - data preparation
       */

      const transactionData =
        JSON.stringify({

          txHash,

          receivedAt:
            timestamp

        });

      // Ensure data has actually been prepared.
      const preparedDataLength =
        Buffer.byteLength(
          transactionData,
          "utf8"
        );

      if (
        preparedDataLength <= 0
      ) {

        throw new Error(
          "Prepared transaction data is empty."
        );

      }

      const fogProcessingEnd =
        performance.now();

      fogProcessingTimeMs =
        Number(
          (
            fogProcessingEnd -
            fogProcessingStart
          ).toFixed(3)
        );

      // ------------------------------------------------
      // IPFS STORAGE
      // ------------------------------------------------

      const ipfsStart =
        performance.now();

      const result =
        await ipfs.add(
          transactionData
        );

      const ipfsEnd =
        performance.now();

      ipfsStorageTimeMs =
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

      // ------------------------------------------------
      // END-TO-END LATENCY
      // ------------------------------------------------

      const requestEnd =
        performance.now();

      const endToEndLatencyMs =
        Number(
          (
            requestEnd -
            requestStart
          ).toFixed(3)
        );

      // ------------------------------------------------
      // SUCCESS COUNTER
      // ------------------------------------------------

      successfulTransactions++;

      // ------------------------------------------------
      // THROUGHPUT
      // ------------------------------------------------

      const cumulativeThroughputTPS =
        calculateCumulativeThroughput();

      const benchmarkThroughputTPS =
        calculateCurrentBenchmarkThroughput();

      // ------------------------------------------------
      // PERFORMANCE RECORD
      // ------------------------------------------------

      const record = {

        architecture:
          "WITH_FOG",

        timestamp,

        benchmarkId:
          benchmarkActive
            ? benchmarkId
            : null,

        transactionNumber:
          successfulTransactions,

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

        fogProcessingTimeMs,

        cumulativeThroughputTPS,

        benchmarkThroughputTPS

      };

      // ------------------------------------------------
      // SAVE PERFORMANCE METRICS
      // ------------------------------------------------

      const metrics =
        readMetrics();

      metrics.push(record);

      writeMetrics(metrics);

      // ------------------------------------------------
      // SAVE HUMAN-READABLE RECORD
      // ------------------------------------------------

      appendRecord(record);

      // ------------------------------------------------
      // CONSOLE OUTPUT
      // ------------------------------------------------

      console.log(
        "\n---------- CONTROLLED PERFORMANCE ----------"
      );

      console.log(
        "End-to-End Latency:",
        endToEndLatencyMs,
        "ms"
      );

      console.log(
        "Fog Processing Time:",
        fogProcessingTimeMs,
        "ms"
      );

      console.log(
        "IPFS Storage Time:",
        ipfsStorageTimeMs,
        "ms"
      );

      console.log(
        "Cumulative Throughput:",
        cumulativeThroughputTPS,
        "TPS"
      );

      console.log(
        "Benchmark Throughput:",
        benchmarkThroughputTPS,
        "TPS"
      );

      console.log(
        "--------------------------------------------\n"
      );

      // ------------------------------------------------
      // RESPONSE TO REACT
      // ------------------------------------------------

      return res.json({

        success: true,

        txHash,

        cid,

        metrics: {

          latencyMs:
            endToEndLatencyMs,

          ipfsStorageTimeMs,

          fogProcessingTimeMs,

          cumulativeThroughputTPS,

          benchmarkThroughputTPS,

          benchmarkId:
            benchmarkActive
              ? benchmarkId
              : null

        }

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
        "ERROR PROCESSING TRANSACTION"
      );

      console.error(error);

      console.error(
        "======================================\n"
      );

      // ------------------------------------------------
      // SAVE FAILED TRANSACTION
      // ------------------------------------------------

      const failedRecord = {

        architecture:
          "WITH_FOG",

        timestamp,

        benchmarkId:
          benchmarkActive
            ? benchmarkId
            : null,

        transactionNumber:
          totalTransactions,

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

        ipfsStorageTimeMs,

        fogProcessingTimeMs,

        cumulativeThroughputTPS:
          calculateCumulativeThroughput(),

        benchmarkThroughputTPS:
          calculateCurrentBenchmarkThroughput(),

        error:
          error.message

      };

      const metrics =
        readMetrics();

      metrics.push(
        failedRecord
      );

      writeMetrics(
        metrics
      );

      return res.status(500).json({

        success: false,

        error:
          error.message,

        metrics: {

          latencyMs,

          ipfsStorageTimeMs,

          fogProcessingTimeMs,

          cumulativeThroughputTPS:
            calculateCumulativeThroughput(),

          benchmarkThroughputTPS:
            calculateCurrentBenchmarkThroughput()

        }

      });

    }

  }
);

// ======================================================
// START SERVER
// ======================================================

app.listen(
  PORT,
  () => {

    console.log(
      "======================================"
    );

    console.log(
      "Drug Supply Chain Fog Server"
    );

    console.log(
      "CONTROLLED BENCHMARK VERSION"
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
      "Controlled performance file:",
      metricsFile
    );

    console.log(
      "Controlled records file:",
      recordsFile
    );

    console.log(
      "======================================"
    );

  }
);