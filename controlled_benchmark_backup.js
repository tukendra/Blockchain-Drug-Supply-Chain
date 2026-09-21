import { ethers } from "ethers";
import fs from "fs";
import { performance } from "perf_hooks";

// ======================================================
// CONTROLLED BLOCKCHAIN WORKLOAD GENERATOR
// ======================================================
//
// Purpose:
// Generate the SAME blockchain transaction workload
// for WITH_FOG and WITHOUT_FOG experiments.
//
// Compatible with:
// - Node.js 22
// - ethers.js 5.8.0
// - Ganache
// - DrugSupplyChain contract
//
// IMPORTANT:
// - Do NOT put your private key directly in this file.
// - Set GANACHE_PRIVATE_KEY as an environment variable.
// ======================================================


// ======================================================
// CONFIGURATION
// ======================================================

const RPC_URL =
  process.env.GANACHE_RPC_URL ||
  "http://127.0.0.1:7545";

const PRIVATE_KEY =
  process.env.GANACHE_PRIVATE_KEY;

const CONTRACT_ADDRESS =
  "0xc1d164b6F650aCB8b77C802198995B44EFA6aAD6";

const SERVER_URL =
  "http://localhost:4000";

// First validation experiment
const TRANSACTION_COUNT = 10;

// Delay between transactions
const DELAY_MS = 1000;


// ======================================================
// CONTRACT ABI
// ======================================================

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


// ======================================================
// VALIDATE PRIVATE KEY
// ======================================================

if (!PRIVATE_KEY) {

  console.error("\nERROR: GANACHE_PRIVATE_KEY is not set.\n");

  console.error(
    "Set your Ganache account private key as an environment variable."
  );

  console.error(
    "Do NOT paste your private key into this chat.\n"
  );

  process.exit(1);
}


// ======================================================
// CONNECT TO GANACHE
// ======================================================

const provider =
  new ethers.providers.JsonRpcProvider(RPC_URL);

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


// ======================================================
// UTILITY
// ======================================================

function sleep(ms) {

  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );

}


// ======================================================
// DETECT SERVER ARCHITECTURE
// ======================================================
//
// The generator asks the server itself whether it is:
//
// WITH_FOG
//
// or
//
// WITHOUT_FOG
//
// This prevents accidentally labeling a No-Fog
// experiment as a Fog experiment.
// ======================================================

async function detectArchitecture() {

  try {

    const response =
      await fetch(SERVER_URL);

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(
        "Server health check failed."
      );

    }

    const architecture =
      data.architecture;

    if (
      architecture !== "WITH_FOG" &&
      architecture !== "WITHOUT_FOG"
    ) {

      throw new Error(
        `Unknown server architecture: ${architecture}`
      );

    }

    return architecture;

  } catch (error) {

    throw new Error(
      `Could not detect server architecture: ${
        error?.message || error
      }`
    );

  }

}


// ======================================================
// CREATE DETERMINISTIC WORKLOAD
// ======================================================
//
// IMPORTANT:
// The exact same workload is used for both
// Fog and No-Fog experiments.
//
// IDs begin at 900001 so they remain separate
// from normal manual testing.
// ======================================================

function createWorkload(count) {

  const workload = [];

  for (
    let i = 1;
    i <= count;
    i++
  ) {

    const baseId =
      900000 + i;

    const type =
      (i - 1) % 8;

    switch (type) {

      // ------------------------------------------------
      // MANUFACTURER
      // ------------------------------------------------

      case 0:

        workload.push({

          entity:
            "Manufacturer",

          operation:
            "addManufacturer",

          execute: () =>
            contract.addManufacturer(

              baseId,

              `ControlledLocation_${i}`,

              `CTRL-MFG-${i}`,

              910000 + i,

              920000 + i

            )

        });

        break;


      // ------------------------------------------------
      // SUPPLIER
      // ------------------------------------------------

      case 1:

        workload.push({

          entity:
            "Supplier",

          operation:
            "addSupplier",

          execute: () =>
            contract.addSupplier(

              baseId,

              `ControlledSupplier_${i}`,

              `ControlledLocation_${i}`,

              `CTRL-SUP-${i}`,

              930000 + i

            )

        });

        break;


      // ------------------------------------------------
      // DISTRIBUTOR
      // ------------------------------------------------

      case 2:

        workload.push({

          entity:
            "Distributor",

          operation:
            "addDistributor",

          execute: () =>
            contract.addDistributor(

              baseId,

              `ControlledDistributor_${i}`,

              `ControlledLocation_${i}`,

              `CTRL-DIS-${i}`,

              900000 + i

            )

        });

        break;


      // ------------------------------------------------
      // PHARMACY
      // ------------------------------------------------

      case 3:

        workload.push({

          entity:
            "Pharmacy",

          operation:
            "addPharmacy",

          execute: () =>
            contract.addPharmacy(

              baseId,

              `ControlledPharmacy_${i}`,

              `ControlledLocation_${i}`,

              `CTRL-PHA-${i}`,

              900000 + i

            )

        });

        break;


      // ------------------------------------------------
      // CUSTOMER
      // ------------------------------------------------

      case 4:

        workload.push({

          entity:
            "Customer",

          operation:
            "addCustomer",

          execute: () =>
            contract.addCustomer(

              baseId,

              `ControlledCustomer_${i}`,

              `CTRL-CONTACT-${i}`,

              900000 + i

            )

        });

        break;


      // ------------------------------------------------
      // LOT
      // ------------------------------------------------

      case 5:

        workload.push({

          entity:
            "Lot",

          operation:
            "addLot",

          execute: () =>
            contract.addLot(

              baseId,

              `ControlledDrug_${i}`,

              100 + i,

              "2026-09-18",

              "2028-09-18",

              900000 + i

            )

        });

        break;


      // ------------------------------------------------
      // SHIPMENT
      // ------------------------------------------------

      case 6:

        workload.push({

          entity:
            "Shipment",

          operation:
            "addShipment",

          execute: () =>
            contract.addShipment(

              baseId,

              900000 + i,

              900000 + i,

              900000 + i,

              "2026-09-18",

              "IN_TRANSIT"

            )

        });

        break;


      // ------------------------------------------------
      // AUDIT LOG
      // ------------------------------------------------

      case 7:

        workload.push({

          entity:
            "AuditLog",

          operation:
            "addAuditLog",

          execute: () =>
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


// ======================================================
// SEND TRANSACTION HASH TO SERVER
// ======================================================

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


// ======================================================
// START BENCHMARK
// ======================================================

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


// ======================================================
// END BENCHMARK
// ======================================================

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


// ======================================================
// MAIN BENCHMARK
// ======================================================

async function runBenchmark() {

  console.log(
    "\n======================================"
  );

  console.log(
    "CONTROLLED WORKLOAD GENERATOR"
  );

  console.log(
    "======================================"
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
    "Transactions:",
    TRANSACTION_COUNT
  );

  console.log(
    "Delay:",
    DELAY_MS,
    "ms"
  );

  console.log(
    "======================================\n"
  );


  // ====================================================
  // CHECK SERVER
  // ====================================================

  const architecture =
    await detectArchitecture();


  console.log(
    "Detected Architecture:",
    architecture
  );


  const architectureLabel =
    architecture === "WITH_FOG"
      ? "FOG"
      : "NO_FOG";


  console.log(
    "Benchmark Mode:",
    architectureLabel
  );


  // ====================================================
  // CHECK GANACHE
  // ====================================================

  const network =
    await provider.getNetwork();


  console.log(
    "Connected Chain ID:",
    network.chainId.toString()
  );


  const address =
    await wallet.getAddress();


  console.log(
    "Benchmark Wallet:",
    address
  );


  const balance =
    await provider.getBalance(
      address
    );


  console.log(
    "Wallet Balance:",
    ethers.utils.formatEther(balance),
    "ETH"
  );


  // ====================================================
  // CREATE WORKLOAD
  // ====================================================

  const workload =
    createWorkload(
      TRANSACTION_COUNT
    );


  console.log(
    "\nWorkload created:",
    workload.length,
    "transactions"
  );


  // ====================================================
  // BENCHMARK ID
  // ====================================================

  const benchmarkId =
    `${architectureLabel}_CONTROLLED_TEST_${Date.now()}`;


  // ====================================================
  // START SERVER BENCHMARK
  // ====================================================

  console.log(
    `\nStarting ${architectureLabel} benchmark...`
  );


  const benchmarkStart =
    await startBenchmark(
      benchmarkId
    );


  console.log(
    "Benchmark started:",
    benchmarkStart.benchmarkId
  );


  // ====================================================
  // EXECUTE WORKLOAD
  // ====================================================

  let successful = 0;

  let failed = 0;

  const results = [];


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
      item.operation
    );


    try {

      // ================================================
      // BLOCKCHAIN TRANSACTION
      // ================================================

      const blockchainStart =
        performance.now();


      const tx =
        await item.execute();


      console.log(
        "Tx submitted:",
        tx.hash
      );


      const receipt =
        await tx.wait();


      const blockchainEnd =
        performance.now();


      const blockchainLatency =
        Number(
          (
            blockchainEnd -
            blockchainStart
          ).toFixed(3)
        );


      console.log(
        "Blockchain confirmation:",
        blockchainLatency,
        "ms"
      );


      // ================================================
      // SEND HASH TO SERVER
      // ================================================

      const serverStart =
        performance.now();


      const serverResult =
        await sendToServer(

          tx.hash,

          item.entity,

          item.operation

        );


      const serverEnd =
        performance.now();


      const serverRoundTrip =
        Number(
          (
            serverEnd -
            serverStart
          ).toFixed(3)
        );


      console.log(
        "Server round-trip:",
        serverRoundTrip,
        "ms"
      );


      // ================================================
      // SERVER METRICS
      // ================================================

      console.log(
        `${architectureLabel} metrics:`,
        serverResult.metrics
      );


      successful++;


      // ================================================
      // SAVE RESULT
      // ================================================

      results.push({

        sequence:
          i + 1,

        entity:
          item.entity,

        operation:
          item.operation,

        txHash:
          tx.hash,

        blockNumber:
          receipt.blockNumber,

        blockchainLatencyMs:
          blockchainLatency,

        serverRoundTripMs:
          serverRoundTrip,

        serverMetrics:
          serverResult.metrics,

        status:
          "SUCCESS"

      });


    } catch (error) {

      failed++;


      console.error(
        "Transaction failed:",
        error?.message ||
        error
      );


      results.push({

        sequence:
          i + 1,

        entity:
          item.entity,

        operation:
          item.operation,

        status:
          "FAILED",

        error:
          error?.message ||
          String(error)

      });

    }


    // ==================================================
    // CONTROLLED DELAY
    // ==================================================

    if (
      i <
      workload.length - 1
    ) {

      await sleep(
        DELAY_MS
      );

    }

  }


  // ====================================================
  // END SERVER BENCHMARK
  // ====================================================

  console.log(
    `\nEnding ${architectureLabel} benchmark...`
  );


  const benchmarkEnd =
    await endBenchmark();


  console.log(
    "\n======================================"
  );

  console.log(
    "BENCHMARK COMPLETE"
  );

  console.log(
    "======================================"
  );


  console.log(
    "Architecture:",
    architecture
  );


  console.log(
    "Benchmark ID:",
    benchmarkEnd.benchmarkId
  );


  console.log(
    "Completed:",
    benchmarkEnd.completedTransactions
  );


  console.log(
    "Failed:",
    benchmarkEnd.failedTransactions
  );


  console.log(
    "Elapsed:",
    benchmarkEnd.elapsedSeconds,
    "seconds"
  );


  console.log(
    "Controlled TPS:",
    benchmarkEnd.throughputTPS
  );


  console.log(
    "======================================\n"
  );


  // ====================================================
  // SAVE LOCAL RESULT
  // ====================================================

  const output = {

    architecture,

    benchmarkId:
      benchmarkEnd.benchmarkId,

    transactionCount:
      TRANSACTION_COUNT,

    successfulTransactions:
      successful,

    failedTransactions:
      failed,

    elapsedSeconds:
      benchmarkEnd.elapsedSeconds,

    throughputTPS:
      benchmarkEnd.throughputTPS,

    delayMs:
      DELAY_MS,

    rpcUrl:
      RPC_URL,

    contractAddress:
      CONTRACT_ADDRESS,

    generatedAt:
      new Date().toISOString(),

    transactions:
      results

  };


  const outputFile =
    architecture === "WITH_FOG"

      ? "controlled_fog_workload_results.json"

      : "controlled_without_fog_workload_results.json";


  fs.writeFileSync(

    outputFile,

    JSON.stringify(
      output,
      null,
      2
    ),

    "utf8"

  );


  console.log(
    "Saved:",
    outputFile
  );

}


// ======================================================
// RUN
// ======================================================

runBenchmark()

  .catch(error => {

    console.error(
      "\nBENCHMARK ERROR:"
    );

    console.error(
      error?.message ||
      error
    );

    process.exit(1);

  });