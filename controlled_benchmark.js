import { ethers } from "ethers";
import fs from "fs";
import { performance } from "perf_hooks";

// ============================================================
// CONTROLLED BLOCKCHAIN EXPERIMENT GENERATOR
// ============================================================
// Purpose:
//   Generate matched WITH_FOG and WITHOUT_FOG workloads
//   for reviewer-grade comparative experiments.
//
// Examples:
//
//   $env:TRANSACTION_COUNT="10"
//   $env:RUN_NUMBER="1"
//   $env:DELAY_MS="1000"
//   node controlled_benchmark.js
//
// Later:
//
//   $env:TRANSACTION_COUNT="50"
//   $env:RUN_NUMBER="1"
//   node controlled_benchmark.js
//
//   $env:TRANSACTION_COUNT="100"
//   $env:RUN_NUMBER="1"
//   node controlled_benchmark.js
//
// Same RUN_NUMBER + TRANSACTION_COUNT = same workload
// for the matched Fog / No-Fog experiment.
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const RPC_URL =
  process.env.GANACHE_RPC_URL ||
  "http://127.0.0.1:7545";

const PRIVATE_KEY =
  process.env.GANACHE_PRIVATE_KEY;

const CONTRACT_ADDRESS =
  "0xc1d164b6F650aCB8b77C802198995B44EFA6aAD6";

const SERVER_URL =
  "http://localhost:4000";


// Number of blockchain transactions
const TRANSACTION_COUNT =
  Number(process.env.TRANSACTION_COUNT || 10);


// Repetition number
const RUN_NUMBER =
  Number(process.env.RUN_NUMBER || 1);


// Delay between transactions
const DELAY_MS =
  Number(process.env.DELAY_MS || 1000);


// ============================================================
// VALIDATION
// ============================================================

if (!PRIVATE_KEY) {

  console.error(
    "\nERROR: GANACHE_PRIVATE_KEY is not set.\n"
  );

  console.error(
    "Set your Ganache private key as an environment variable."
  );

  console.error(
    "Do NOT paste your private key into this chat.\n"
  );

  process.exit(1);
}


if (
  !Number.isInteger(TRANSACTION_COUNT) ||
  TRANSACTION_COUNT < 1
) {

  throw new Error(
    "TRANSACTION_COUNT must be a positive integer."
  );
}


if (
  !Number.isInteger(RUN_NUMBER) ||
  RUN_NUMBER < 1
) {

  throw new Error(
    "RUN_NUMBER must be a positive integer."
  );
}


if (
  !Number.isFinite(DELAY_MS) ||
  DELAY_MS < 0
) {

  throw new Error(
    "DELAY_MS must be >= 0."
  );
}


// ============================================================
// CONTRACT ABI
// ============================================================

const ABI = [

  // Manufacturer

  "function addManufacturer(uint256 _id, string memory _location, string memory _licenseNo, uint256 _supplierId, uint256 _govId)",


  // Supplier

  "function addSupplier(uint256 _id, string memory _name, string memory _location, string memory _licenseNo, uint256 _govId)",


  // Distributor

  "function addDistributor(uint256 _id, string memory _name, string memory _location, string memory _licenseNo, uint256 _manufacturerId)",


  // Pharmacy

  "function addPharmacy(uint256 _id, string memory _name, string memory _location, string memory _licenseNo, uint256 _distributorId)",


  // Customer

  "function addCustomer(uint256 _id, string memory _name, string memory _contactInfo, uint256 _pharmacyId)",


  // Lot

  "function addLot(uint256 _lotId, string memory _drugName, uint256 _quantity, string memory _mfgDate, string memory _expDate, uint256 _manufacturerId)",


  // Shipment

  "function addShipment(uint256 _shipmentId, uint256 _lotId, uint256 _sourceId, uint256 _destinationId, string memory _shipDate, string memory _status)",


  // Audit Log

  "function addAuditLog(uint256 _auditId, string memory _entity, string memory _action, string memory _timestamp, uint256 _userId)"

];


// ============================================================
// GANACHE CONNECTION
// ============================================================

const provider =
  new ethers.providers.JsonRpcProvider(
    RPC_URL
  );


const wallet =
  new ethers.Wallet(
    PRIVATE_KEY,
    provider
  );


const contract =
  new ethers.Contract(
    CONTRACT_ADDRESS,
    ABI,
    wallet
  );


// ============================================================
// UTILITY
// ============================================================

function sleep(ms) {

  return new Promise(
    resolve => setTimeout(resolve, ms)
  );

}


// ============================================================
// STATISTICS FUNCTIONS
// ============================================================

function mean(values) {

  if (!values.length) {

    return null;

  }

  return (
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length
  );

}


function standardDeviation(values) {

  if (values.length < 2) {

    return 0;

  }

  const avg =
    mean(values);


  const variance =
    values.reduce(
      (sum, value) => {

        return (
          sum +
          Math.pow(
            value - avg,
            2
          )
        );

      },
      0
    ) /
    (values.length - 1);


  return Math.sqrt(
    variance
  );

}


function percentile(values, p) {

  if (!values.length) {

    return null;

  }


  const sorted =
    [...values].sort(
      (a, b) => a - b
    );


  const index =
    (sorted.length - 1) * p;


  const lower =
    Math.floor(index);


  const upper =
    Math.ceil(index);


  if (lower === upper) {

    return sorted[lower];

  }


  return (
    sorted[lower] +
    (
      sorted[upper] -
      sorted[lower]
    ) *
    (index - lower)
  );

}


function summarize(values) {

  const clean =
    values
      .map(Number)
      .filter(
        Number.isFinite
      );


  if (!clean.length) {

    return {

      n: 0,

      mean: null,

      median: null,

      standardDeviation: null,

      p95: null,

      ci95HalfWidth: null,

      min: null,

      max: null

    };

  }


  const avg =
    mean(clean);


  const sd =
    standardDeviation(clean);


  const ci95 =
    clean.length > 1
      ? 1.96 *
        sd /
        Math.sqrt(
          clean.length
        )
      : null;


  return {

    n:
      clean.length,

    mean:
      Number(
        avg.toFixed(3)
      ),

    median:
      Number(
        percentile(
          clean,
          0.50
        ).toFixed(3)
      ),

    standardDeviation:
      Number(
        sd.toFixed(3)
      ),

    p95:
      Number(
        percentile(
          clean,
          0.95
        ).toFixed(3)
      ),

    ci95HalfWidth:
      ci95 === null
        ? null
        : Number(
            ci95.toFixed(3)
          ),

    min:
      Number(
        Math.min(
          ...clean
        ).toFixed(3)
      ),

    max:
      Number(
        Math.max(
          ...clean
        ).toFixed(3)
      )

  };

}


// ============================================================
// SERVER ARCHITECTURE DETECTION
// ============================================================

async function detectArchitecture() {

  const response =
    await fetch(
      SERVER_URL
    );


  let data;


  try {

    data =
      await response.json();

  } catch {

    throw new Error(
      "Server health endpoint did not return valid JSON."
    );

  }


  if (!response.ok) {

    throw new Error(
      `Server health check failed: HTTP ${response.status}`
    );

  }


  const architecture =
    data.architecture;


  if (
    architecture !==
      "WITH_FOG" &&
    architecture !==
      "WITHOUT_FOG"
  ) {

    throw new Error(
      `Unknown server architecture: ${architecture}`
    );

  }


  return architecture;

}


// ============================================================
// CREATE CONTROLLED WORKLOAD
// ============================================================
//
// RUN_NUMBER creates a different ID range for each repetition.
//
// Example:
//
// Run 1:
// 900001, 900002, ...
//
// Run 2:
// 901001, 901002, ...
//
// Run 3:
// 902001, 902002, ...
//
// The same Run Number is used for the matched Fog and No-Fog
// experiment, therefore the workload remains matched.
// ============================================================

function createWorkload(
  count,
  runNumber
) {

  const workload = [];


  const runBase =
    900000 +
    (
      (runNumber - 1) *
      1000
    );


  for (
    let i = 1;
    i <= count;
    i++
  ) {

    const baseId =
      runBase + i;


    const type =
      (i - 1) % 8;


    switch (type) {


      // ======================================================
      // MANUFACTURER
      // ======================================================

      case 0:

        workload.push({

          entity:
            "Manufacturer",

          operation:
            "addManufacturer",

          execute:
            () =>
              contract.addManufacturer(

                baseId,

                `ControlledLocation_${i}`,

                `CTRL-MFG-${i}`,

                910000 + i,

                920000 + i

              )

        });

        break;


      // ======================================================
      // SUPPLIER
      // ======================================================

      case 1:

        workload.push({

          entity:
            "Supplier",

          operation:
            "addSupplier",

          execute:
            () =>
              contract.addSupplier(

                baseId,

                `ControlledSupplier_${i}`,

                `ControlledLocation_${i}`,

                `CTRL-SUP-${i}`,

                930000 + i

              )

        });

        break;


      // ======================================================
      // DISTRIBUTOR
      // ======================================================

      case 2:

        workload.push({

          entity:
            "Distributor",

          operation:
            "addDistributor",

          execute:
            () =>
              contract.addDistributor(

                baseId,

                `ControlledDistributor_${i}`,

                `ControlledLocation_${i}`,

                `CTRL-DIS-${i}`,

                runBase + i

              )

        });

        break;


      // ======================================================
      // PHARMACY
      // ======================================================

      case 3:

        workload.push({

          entity:
            "Pharmacy",

          operation:
            "addPharmacy",

          execute:
            () =>
              contract.addPharmacy(

                baseId,

                `ControlledPharmacy_${i}`,

                `ControlledLocation_${i}`,

                `CTRL-PHA-${i}`,

                runBase + i

              )

        });

        break;


      // ======================================================
      // CUSTOMER
      // ======================================================

      case 4:

        workload.push({

          entity:
            "Customer",

          operation:
            "addCustomer",

          execute:
            () =>
              contract.addCustomer(

                baseId,

                `ControlledCustomer_${i}`,

                `CTRL-CONTACT-${i}`,

                runBase + i

              )

        });

        break;


      // ======================================================
      // LOT
      // ======================================================

      case 5:

        workload.push({

          entity:
            "Lot",

          operation:
            "addLot",

          execute:
            () =>
              contract.addLot(

                baseId,

                `ControlledDrug_${i}`,

                100 + i,

                "2026-09-18",

                "2028-09-18",

                runBase + i

              )

        });

        break;


      // ======================================================
      // SHIPMENT
      // ======================================================

      case 6:

        workload.push({

          entity:
            "Shipment",

          operation:
            "addShipment",

          execute:
            () =>
              contract.addShipment(

                baseId,

                runBase + i,

                runBase + i,

                runBase + i,

                "2026-09-18",

                "IN_TRANSIT"

              )

        });

        break;


      // ======================================================
      // AUDIT LOG
      // ======================================================

      case 7:

        workload.push({

          entity:
            "AuditLog",

          operation:
            "addAuditLog",

          execute:
            () =>
              contract.addAuditLog(

                baseId,

                "ControlledBenchmark",

                `TEST_ACTION_${i}`,

                new Date().toISOString(),

                950000 + i

              )

        });

        break;

    }

  }


  return workload;

}


// ============================================================
// SEND TRANSACTION TO SERVER
// ============================================================

async function sendToServer(
  txHash,
  entity,
  operation
) {

  const response =
    await fetch(
      `${SERVER_URL}/store`,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            txHash,

            entity,

            operation

          })

      }
    );


  let data;


  try {

    data =
      await response.json();

  } catch {

    throw new Error(
      "Server returned invalid JSON."
    );

  }


  if (
    !response.ok ||
    !data.success
  ) {

    throw new Error(
      data?.error ||
      "Server failed to store transaction."
    );

  }


  return data;

}


// ============================================================
// START SERVER BENCHMARK
// ============================================================

async function startBenchmark(
  benchmarkId
) {

  const response =
    await fetch(
      `${SERVER_URL}/benchmark/start`,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({

            benchmarkId

          })

      }
    );


  const data =
    await response.json();


  if (
    !response.ok ||
    !data.success
  ) {

    throw new Error(
      data?.error ||
      "Could not start benchmark."
    );

  }


  return data;

}


// ============================================================
// END SERVER BENCHMARK
// ============================================================

async function endBenchmark() {

  const response =
    await fetch(
      `${SERVER_URL}/benchmark/end`,
      {

        method:
          "POST",

        headers: {

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify({})

      }
    );


  const data =
    await response.json();


  if (
    !response.ok ||
    !data.success
  ) {

    throw new Error(
      data?.error ||
      "Could not end benchmark."
    );

  }


  return data;

}


// ============================================================
// BUILD STATISTICAL SUMMARY
// ============================================================

function buildSummary(
  results
) {

  const successful =
    results.filter(
      r =>
        r.status ===
        "SUCCESS"
    );


  const latency =
    successful
      .map(
        r =>
          Number(
            r.serverMetrics?.latency ??
            r.serverMetrics?.latencyMs ??
            r.serverMetrics?.endToEndLatency ??
            r.serverMetrics?.endToEndLatencyMs
          )
      )
      .filter(
        Number.isFinite
      );


  const ipfs =
    successful
      .map(
        r =>
          Number(
            r.serverMetrics?.ipfsStorageTime ??
            r.serverMetrics?.ipfsStorageTimeMs ??
            r.serverMetrics?.ipfsLatency ??
            r.serverMetrics?.ipfsLatencyMs
          )
      )
      .filter(
        Number.isFinite
      );


  const fog =
    successful
      .map(
        r =>
          Number(
            r.serverMetrics?.fogProcessingTime ??
            r.serverMetrics?.fogProcessingTimeMs ??
            r.serverMetrics?.edgeProcessingTime ??
            r.serverMetrics?.edgeProcessingTimeMs
          )
      )
      .filter(
        Number.isFinite
      );


  const blockchain =
    successful
      .map(
        r =>
          Number(
            r.blockchainLatencyMs
          )
      )
      .filter(
        Number.isFinite
      );


  const serverRoundTrip =
    successful
      .map(
        r =>
          Number(
            r.serverRoundTripMs
          )
      )
      .filter(
        Number.isFinite
      );


  return {

    successfulTransactions:
      successful.length,

    failedTransactions:
      results.length -
      successful.length,

    successRatePercent:
      results.length
        ? Number(
            (
              successful.length /
              results.length *
              100
            ).toFixed(3)
          )
        : 0,

    endToEndLatencyMs:
      summarize(
        latency
      ),

    ipfsStorageTimeMs:
      summarize(
        ipfs
      ),

    blockchainConfirmationMs:
      summarize(
        blockchain
      ),

    serverRoundTripMs:
      summarize(
        serverRoundTrip
      ),

    fogOrEdgeProcessingMs:
      summarize(
        fog
      )

  };

}


// ============================================================
// MAIN BENCHMARK
// ============================================================

async function runBenchmark() {

  console.log(
    "\n===================================================="
  );

  console.log(
    "CONTROLLED BLOCKCHAIN EXPERIMENT"
  );

  console.log(
    "===================================================="
  );

  console.log(
    "Run Number:",
    RUN_NUMBER
  );

  console.log(
    "Transactions:",
    TRANSACTION_COUNT
  );

  console.log(
    "Delay:",
    DELAY_MS,
    "ms"
  );

  console.log(
    "RPC:",
    RPC_URL
  );

  console.log(
    "Contract:",
    CONTRACT_ADDRESS
  );

  console.log(
    "Server:",
    SERVER_URL
  );

  console.log(
    "====================================================\n"
  );


  // ==========================================================
  // DETECT SERVER
  // ==========================================================

  const architecture =
    await detectArchitecture();


  const architectureLabel =
    architecture ===
      "WITH_FOG"
      ? "FOG"
      : "NO_FOG";


  console.log(
    "Detected Architecture:",
    architecture
  );


  console.log(
    "Experiment Condition:",
    architectureLabel
  );


  // ==========================================================
  // CHECK GANACHE
  // ==========================================================

  const network =
    await provider.getNetwork();


  const address =
    await wallet.getAddress();


  const balance =
    await provider.getBalance(
      address
    );


  console.log(
    "Chain ID:",
    network.chainId.toString()
  );


  console.log(
    "Wallet:",
    address
  );


  console.log(
    "Wallet Balance:",
    ethers.utils.formatEther(
      balance
    ),
    "ETH"
  );


  // ==========================================================
  // CREATE WORKLOAD
  // ==========================================================

  const workload =
    createWorkload(
      TRANSACTION_COUNT,
      RUN_NUMBER
    );


  console.log(
    "\nWorkload created:",
    workload.length,
    "transactions"
  );


  // ==========================================================
  // BENCHMARK ID
  // ==========================================================

  const benchmarkId =
    `${architectureLabel}_RUN_${String(
      RUN_NUMBER
    ).padStart(2, "0")}_${TRANSACTION_COUNT}TX_${Date.now()}`;


  console.log(
    "Benchmark ID:",
    benchmarkId
  );


  // ==========================================================
  // START BENCHMARK
  // ==========================================================

  console.log(
    `\nStarting ${architectureLabel} benchmark...`
  );


  await startBenchmark(
    benchmarkId
  );


  console.log(
    "Benchmark started."
  );


  const localStart =
    performance.now();


  const benchmarkStartTime =
    new Date().toISOString();


  const results = [];


  // ==========================================================
  // EXECUTE TRANSACTIONS
  // ==========================================================

  for (
    let i = 0;
    i < workload.length;
    i++
  ) {

    const item =
      workload[i];


    console.log(
      `\n[${i + 1}/${workload.length}]`,
      item.entity,
      "|",
      item.operation
    );


    const transactionResult = {

      sequence:
        i + 1,

      entity:
        item.entity,

      operation:
        item.operation,

      status:
        "FAILED"

    };


    try {

      // ======================================================
      // BLOCKCHAIN TRANSACTION
      // ======================================================

      const blockchainStart =
        performance.now();


      const tx =
        await item.execute();


      console.log(
        "  Tx submitted:",
        tx.hash
      );


      const receipt =
        await tx.wait();


      const blockchainLatency =
        Number(
          (
            performance.now() -
            blockchainStart
          ).toFixed(3)
        );


      console.log(
        "  Blockchain confirmation:",
        blockchainLatency,
        "ms"
      );


      // ======================================================
      // SERVER STORAGE
      // ======================================================

      const serverStart =
        performance.now();


      const serverResult =
        await sendToServer(

          tx.hash,

          item.entity,

          item.operation

        );


      const serverRoundTrip =
        Number(
          (
            performance.now() -
            serverStart
          ).toFixed(3)
        );


      console.log(
        "  Server round-trip:",
        serverRoundTrip,
        "ms"
      );


      console.log(
        `  ${architectureLabel} metrics:`,
        serverResult.metrics
      );


      // ======================================================
      // SAVE SUCCESS RESULT
      // ======================================================

      transactionResult.txHash =
        tx.hash;


      transactionResult.blockNumber =
        receipt.blockNumber;


      transactionResult.blockchainLatencyMs =
        blockchainLatency;


      transactionResult.serverRoundTripMs =
        serverRoundTrip;


      transactionResult.serverMetrics =
        serverResult.metrics ||
        {};


      transactionResult.status =
        "SUCCESS";


    } catch (error) {

      transactionResult.error =
        error?.message ||
        String(error);


      console.error(
        "  FAILED:",
        transactionResult.error
      );

    }


    results.push(
      transactionResult
    );


    // ==========================================================
    // CONTROLLED DELAY
    // ==========================================================

    if (
      i <
      workload.length - 1
    ) {

      await sleep(
        DELAY_MS
      );

    }

  }


  // ==========================================================
  // LOCAL ELAPSED TIME
  // ==========================================================

  const localElapsedSeconds =
    (
      performance.now() -
      localStart
    ) / 1000;


  // ==========================================================
  // END SERVER BENCHMARK
  // ==========================================================

  console.log(
    `\nEnding ${architectureLabel} benchmark...`
  );


  let benchmarkEnd;


  try {

    benchmarkEnd =
      await endBenchmark();


  } catch (error) {

    console.error(
      "WARNING: Could not close server benchmark:",
      error?.message ||
      error
    );


    const successful =
      results.filter(
        r =>
          r.status ===
          "SUCCESS"
      ).length;


    benchmarkEnd = {

      benchmarkId,

      completedTransactions:
        successful,

      failedTransactions:
        results.length -
        successful,

      elapsedSeconds:
        Number(
          localElapsedSeconds.toFixed(3)
        ),

      throughputTPS:
        Number(
          (
            successful /
            Math.max(
              localElapsedSeconds,
              0.001
            )
          ).toFixed(4)
        )

    };

  }


  // ==========================================================
  // STATISTICAL SUMMARY
  // ==========================================================

  const summary =
    buildSummary(
      results
    );


  const successful =
    summary.successfulTransactions;


  const failed =
    summary.failedTransactions;


  const elapsedSeconds =
    Number(
      (
        Number(
          benchmarkEnd.elapsedSeconds
        ) ||
        localElapsedSeconds
      ).toFixed(3)
    );


  // ==========================================================
  // CONTROLLED THROUGHPUT
  // ==========================================================
  //
  // Throughput is calculated from:
  //
  // successful transactions / total benchmark elapsed time
  //
  // This avoids the old cumulative-server-start TPS issue.
  // ==========================================================

  const throughputTPS =
    Number(
      (
        successful /
        Math.max(
          elapsedSeconds,
          0.001
        )
      ).toFixed(4)
    );


  // ==========================================================
  // BUILD FINAL OUTPUT
  // ==========================================================

  const output = {

    experiment: {

      architecture,

      condition:
        architectureLabel,

      runNumber:
        RUN_NUMBER,

      transactionCount:
        TRANSACTION_COUNT,

      delayMs:
        DELAY_MS,

      benchmarkId:
        benchmarkEnd.benchmarkId ||
        benchmarkId,

      chainId:
        Number(
          network.chainId
        ),

      rpcUrl:
        RPC_URL,

      contractAddress:
        CONTRACT_ADDRESS,

      benchmarkStartTime,

      generatedAt:
        new Date().toISOString()

    },


    resultsSummary: {

      successfulTransactions:
        successful,

      failedTransactions:
        failed,

      successRatePercent:
        summary.successRatePercent,

      elapsedSeconds,

      controlledThroughputTPS:
        throughputTPS,

      serverReportedThroughputTPS:
        Number(
          benchmarkEnd.throughputTPS
        )

    },


    metrics:
      summary,


    transactions:
      results

  };


  // ==========================================================
  // CREATE RESULTS DIRECTORY
  // ==========================================================

  const resultsDir =
    "benchmark_results";


  fs.mkdirSync(
    resultsDir,
    {
      recursive: true
    }
  );


  // ==========================================================
  // SAVE JSON
  // ==========================================================

  const runFile =
    `${architectureLabel}_run${String(
      RUN_NUMBER
    ).padStart(2, "0")}_${TRANSACTION_COUNT}tx.json`;


  const outputFile =
    `${resultsDir}/${runFile}`;


  fs.writeFileSync(

    outputFile,

    JSON.stringify(
      output,
      null,
      2
    ),

    "utf8"

  );


  // ==========================================================
  // SAVE CSV
  // ==========================================================

  const csvFile =
    `${resultsDir}/benchmark_runs.csv`;


  const csvHeader =
    "architecture,runNumber,transactionCount,delayMs,successful,failed,successRatePercent,elapsedSeconds,throughputTPS,latencyMeanMs,latencyMedianMs,latencySDMs,latencyP95Ms,latencyCI95HalfWidthMs,ipfsMeanMs,ipfsMedianMs,ipfsSDMs,ipfsP95Ms,ipfsCI95HalfWidthMs,fogProcessingMeanMs,blockchainMeanMs,serverRoundTripMeanMs\n";


  if (
    !fs.existsSync(
      csvFile
    )
  ) {

    fs.writeFileSync(
      csvFile,
      csvHeader,
      "utf8"
    );

  }


  const latency =
    summary.endToEndLatencyMs;


  const ipfs =
    summary.ipfsStorageTimeMs;


  const fog =
    summary.fogOrEdgeProcessingMs;


  const blockchain =
    summary.blockchainConfirmationMs;


  const serverRoundTrip =
    summary.serverRoundTripMs;


  const csvRow = [

    architecture,

    RUN_NUMBER,

    TRANSACTION_COUNT,

    DELAY_MS,

    successful,

    failed,

    summary.successRatePercent,

    elapsedSeconds,

    throughputTPS,

    latency.mean ?? "",

    latency.median ?? "",

    latency.standardDeviation ?? "",

    latency.p95 ?? "",

    latency.ci95HalfWidth ?? "",

    ipfs.mean ?? "",

    ipfs.median ?? "",

    ipfs.standardDeviation ?? "",

    ipfs.p95 ?? "",

    ipfs.ci95HalfWidth ?? "",

    fog.mean ?? "",

    blockchain.mean ?? "",

    serverRoundTrip.mean ?? ""

  ].join(",") + "\n";


  fs.appendFileSync(
    csvFile,
    csvRow,
    "utf8"
  );


  // ==========================================================
  // FINAL DISPLAY
  // ==========================================================

  console.log(
    "\n===================================================="
  );

  console.log(
    "EXPERIMENT RUN COMPLETE"
  );

  console.log(
    "===================================================="
  );

  console.log(
    "Architecture:",
    architecture
  );

  console.log(
    "Run:",
    RUN_NUMBER
  );

  console.log(
    "Transactions:",
    TRANSACTION_COUNT
  );

  console.log(
    "Successful:",
    successful
  );

  console.log(
    "Failed:",
    failed
  );

  console.log(
    "Success Rate:",
    summary.successRatePercent,
    "%"
  );

  console.log(
    "Elapsed:",
    elapsedSeconds,
    "seconds"
  );

  console.log(
    "Controlled TPS:",
    throughputTPS
  );

  console.log(
    "\nLatency:",
    summary.endToEndLatencyMs
  );

  console.log(
    "IPFS:",
    summary.ipfsStorageTimeMs
  );

  console.log(
    "Blockchain:",
    summary.blockchainConfirmationMs
  );

  console.log(
    "Server Round-trip:",
    summary.serverRoundTripMs
  );

  console.log(
    "Fog/Edge:",
    summary.fogOrEdgeProcessingMs
  );

  console.log(
    "\nSaved:",
    outputFile
  );

  console.log(
    "Updated:",
    csvFile
  );

  console.log(
    "====================================================\n"
  );

}


// ============================================================
// RUN
// ============================================================

runBenchmark()

  .catch(
    error => {

      console.error(
        "\nBENCHMARK ERROR:"
      );

      console.error(
        error?.stack ||
        error?.message ||
        error
      );

      process.exit(1);

    }
  );