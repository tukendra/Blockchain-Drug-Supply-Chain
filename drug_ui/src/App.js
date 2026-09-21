import React, { useState } from "react";
import { ethers } from "ethers";
import DrugSupplyChain from "./contracts/DrugSupplyChain.json";

// Deployed DrugSupplyChain contract address
const contractAddress = "0xc1d164b6F650aCB8b77C802198995B44EFA6aAD6";

/*
 * ============================================================
 * UINT VALIDATION HELPER
 * ============================================================
 *
 * Prevents NaN, empty strings, decimals and negative values
 * from being passed to Solidity uint256 parameters.
 */
const toUint = (value, fieldName) => {
  const text = String(value ?? "").trim();

  if (text === "") {
    alert(`${fieldName} is required.`);
    return null;
  }

  if (!/^\d+$/.test(text)) {
    alert(`${fieldName} must contain only numbers.`);
    return null;
  }

  const numberValue = Number(text);

  if (
    !Number.isSafeInteger(numberValue) ||
    numberValue < 0
  ) {
    alert(
      `${fieldName} must be a valid non-negative integer.`
    );
    return null;
  }

  return numberValue;
};

/*
 * ============================================================
 * TEXT VALIDATION HELPER
 * ============================================================
 */
const requiredText = (value, fieldName) => {
  const text = String(value ?? "").trim();

  if (!text) {
    alert(`${fieldName} is required.`);
    return null;
  }

  return text;
};

function App() {
  const [currentAccount, setCurrentAccount] =
    useState(null);

  const [contract, setContract] = useState(null);

  // ==========================================================
  // STATES
  // ==========================================================

  /*
   * Manufacturer ABI:
   * addManufacturer(
   *   uint256 _id,
   *   string _location,
   *   string _licenseNo,
   *   uint256 _supplierId,
   *   uint256 _govId
   * )
   */
  const [manufacturer, setManufacturer] = useState({
    id: "",
    location: "",
    licenseNo: "",
    supplierId: "",
    govId: "",
  });

  /*
   * Supplier ABI:
   * addSupplier(
   *   uint256 _id,
   *   string _name,
   *   string _location,
   *   string _licenseNo,
   *   uint256 _govId
   * )
   */
  const [supplier, setSupplier] = useState({
    id: "",
    name: "",
    location: "",
    licenseNo: "",
    govId: "",
  });

  /*
   * Distributor ABI:
   * addDistributor(
   *   uint256 _id,
   *   string _name,
   *   string _location,
   *   string _licenseNo,
   *   uint256 _manufacturerId
   * )
   */
  const [distributor, setDistributor] =
    useState({
      id: "",
      name: "",
      location: "",
      licenseNo: "",
      manufacturerId: "",
    });

  /*
   * Pharmacy ABI:
   * addPharmacy(
   *   uint256 _id,
   *   string _name,
   *   string _location,
   *   string _licenseNo,
   *   uint256 _distributorId
   * )
   */
  const [pharmacy, setPharmacy] = useState({
    id: "",
    name: "",
    location: "",
    licenseNo: "",
    distributorId: "",
  });

  /*
   * Customer ABI:
   * addCustomer(
   *   uint256 _id,
   *   string _name,
   *   string _contactInfo,
   *   uint256 _pharmacyId
   * )
   */
  const [customer, setCustomer] = useState({
    id: "",
    name: "",
    contactInfo: "",
    pharmacyId: "",
  });

  /*
   * Lot ABI:
   * addLot(
   *   uint256 _lotId,
   *   string _drugName,
   *   uint256 _quantity,
   *   string _mfgDate,
   *   string _expDate,
   *   uint256 _manufacturerId
   * )
   */
  const [lot, setLot] = useState({
    lotId: "",
    drugName: "",
    quantity: "",
    mfgDate: "",
    expDate: "",
    manufacturerId: "",
  });

  /*
   * Shipment ABI:
   * addShipment(
   *   uint256 _shipmentId,
   *   uint256 _lotId,
   *   uint256 _sourceId,
   *   uint256 _destinationId,
   *   string _shipDate,
   *   string _status
   * )
   */
  const [shipment, setShipment] =
    useState({
      shipmentId: "",
      lotId: "",
      sourceId: "",
      destinationId: "",
      shipDate: "",
      status: "",
    });

  /*
   * Audit ABI:
   * addAuditLog(
   *   uint256 _auditId,
   *   string _entity,
   *   string _action,
   *   string _timestamp,
   *   uint256 _userId
   * )
   */
  const [audit, setAudit] = useState({
    auditId: "",
    entity: "",
    action: "",
    timestamp: "",
    userId: "",
  });

  // ==========================================================
  // IPFS RESULT
  // ==========================================================

  const [ipfsCid, setIpfsCid] = useState(null);
  const [ipfsUrl, setIpfsUrl] = useState(null);

  // ==========================================================
  // CONNECT METAMASK
  // ==========================================================

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const accounts =
        await window.ethereum.request({
          method: "eth_requestAccounts",
        });

      if (!accounts || accounts.length === 0) {
        alert("No MetaMask account found.");
        return;
      }

      setCurrentAccount(accounts[0]);

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer =
        await provider.getSigner();

      const contractInstance =
        new ethers.Contract(
          contractAddress,
          DrugSupplyChain.abi,
          signer
        );

      setContract(contractInstance);

      console.log(
        "Connected account:",
        accounts[0]
      );

      console.log(
        "Contract address:",
        contractInstance.target
      );

      /*
       * Print the available functions.
       * This is useful for debugging ABI mismatch.
       */
      console.log(
        "Contract functions:",
        Object.keys(
          contractInstance.interface.functions || {}
        )
      );

      alert(
        `Wallet connected successfully.\n\nAccount:\n${accounts[0]}`
      );
    } catch (err) {
      console.error(
        "Wallet connection failed:",
        err
      );

      alert(
        `Wallet connection failed:\n${
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          err
        }`
      );
    }
  };

  // ==========================================================
  // HANDLE TRANSACTION + FOG SERVER + IPFS
  // ==========================================================

  const handleTx = async (
    txPromise,
    successMsg,
    entityName,
    operationName
  ) => {
    if (!contract) {
      alert(
        "Contract is not ready. Please connect MetaMask first."
      );
      return;
    }

    try {
      console.log(
        `${entityName} transaction starting...`
      );

      /*
       * Wait for MetaMask transaction submission.
       */
      const tx = await txPromise;

      console.log(
        "Transaction submitted:",
        tx.hash
      );

      /*
       * Wait for blockchain confirmation.
       */
      const receipt = await tx.wait();

      console.log(
        "Transaction confirmed:",
        receipt
      );

      /*
       * Send transaction hash to Edge/Fog server.
       */
      const res = await fetch(
        "http://localhost:4000/store",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            txHash: tx.hash,
            entity: entityName,
            operation: operationName,
          }),
        }
      );

      let data;

      try {
        data = await res.json();
      } catch (jsonError) {
        console.error(
          "Invalid server JSON:",
          jsonError
        );

        throw new Error(
          "Fog server returned an invalid response."
        );
      }

      if (!res.ok || !data.success) {
        throw new Error(
          data?.error ||
            "Fog/IPFS server failed to store the transaction."
        );
      }

      /*
       * CID returned by the server.
       */
      const cidStr = data.cid;

      if (!cidStr) {
        throw new Error(
          "Transaction was confirmed, but IPFS CID was not returned."
        );
      }

      /*
       * Local IPFS Desktop gateway.
       */
      const gatewayUrl =
        `http://127.0.0.1:8080/ipfs/${cidStr}`;

      setIpfsCid(cidStr);
      setIpfsUrl(gatewayUrl);

      console.log(
        "Transaction Hash:",
        tx.hash
      );

      console.log(
        "IPFS CID:",
        cidStr
      );

      console.log(
        "Performance metrics:",
        data.metrics
      );

      const metrics =
        data.metrics || {};

      const latency =
        metrics.latencyMs ??
        metrics.endToEndLatencyMs ??
        "N/A";

      const ipfsStorage =
        metrics.ipfsStorageTimeMs ??
        "N/A";

      const fogProcessing =
        metrics.fogProcessingTimeMs ??
        "N/A";

      const throughput =
        metrics.throughputTPS ??
        "N/A";

      alert(
        `${successMsg}\n\n` +
        `Transaction Hash:\n${tx.hash}\n\n` +
        `IPFS CID:\n${cidStr}\n\n` +
        `Latency: ${latency} ms\n` +
        `IPFS Storage Time: ${ipfsStorage} ms\n` +
        `Fog Processing Time: ${fogProcessing} ms\n` +
        `Throughput: ${throughput} TPS`
      );
    } catch (err) {
      console.error(
        "Transaction failed:",
        err
      );

      alert(
        `Transaction failed:\n${
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          err
        }`
      );
    }
  };

  // ==========================================================
  // MANUFACTURER
  // ==========================================================

  const addManufacturer = async () => {
    try {
      if (!contract) {
        alert("Connect MetaMask first.");
        return;
      }

      const id = toUint(
        manufacturer.id,
        "Manufacturer ID"
      );

      if (id === null) return;

      const supplierId = toUint(
        manufacturer.supplierId,
        "Supplier ID"
      );

      if (supplierId === null) return;

      const govId = toUint(
        manufacturer.govId,
        "Government ID"
      );

      if (govId === null) return;

      const location = requiredText(
        manufacturer.location,
        "Manufacturer Location"
      );

      if (location === null) return;

      const licenseNo = requiredText(
        manufacturer.licenseNo,
        "Manufacturer License No."
      );

      if (licenseNo === null) return;

      console.log(
        "addManufacturer arguments:",
        {
          id,
          location,
          licenseNo,
          supplierId,
          govId,
        }
      );

      /*
       * EXACT ABI:
       *
       * addManufacturer(
       *   uint256,
       *   string,
       *   string,
       *   uint256,
       *   uint256
       * )
       */
      const txPromise =
        contract.addManufacturer(
          id,
          location,
          licenseNo,
          supplierId,
          govId
        );

      await handleTx(
        txPromise,
        "Manufacturer Added!",
        "Manufacturer",
        "addManufacturer"
      );
    } catch (err) {
      console.error(
        "Manufacturer error:",
        err
      );

      alert(
        `Manufacturer transaction failed:\n${
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          err
        }`
      );
    }
  };

  // ==========================================================
  // SUPPLIER
  // ==========================================================

  const addSupplier = async () => {
    try {
      if (!contract) {
        alert("Connect MetaMask first.");
        return;
      }

      const id = toUint(
        supplier.id,
        "Supplier ID"
      );

      if (id === null) return;

      const govId = toUint(
        supplier.govId,
        "Government ID"
      );

      if (govId === null) return;

      const name = requiredText(
        supplier.name,
        "Supplier Name"
      );

      if (name === null) return;

      const location = requiredText(
        supplier.location,
        "Supplier Location"
      );

      if (location === null) return;

      const licenseNo = requiredText(
        supplier.licenseNo,
        "Supplier License No."
      );

      if (licenseNo === null) return;

      console.log(
        "addSupplier arguments:",
        {
          id,
          name,
          location,
          licenseNo,
          govId,
        }
      );

      const txPromise =
        contract.addSupplier(
          id,
          name,
          location,
          licenseNo,
          govId
        );

      await handleTx(
        txPromise,
        "Supplier Added!",
        "Supplier",
        "addSupplier"
      );
    } catch (err) {
      console.error(
        "Supplier error:",
        err
      );

      alert(
        `Supplier transaction failed:\n${
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          err
        }`
      );
    }
  };

  // ==========================================================
  // DISTRIBUTOR
  // ==========================================================

  const addDistributor = async () => {
    try {
      if (!contract) {
        alert("Connect MetaMask first.");
        return;
      }

      const id = toUint(
        distributor.id,
        "Distributor ID"
      );

      if (id === null) return;

      const manufacturerId = toUint(
        distributor.manufacturerId,
        "Manufacturer ID"
      );

      if (manufacturerId === null) return;

      const name = requiredText(
        distributor.name,
        "Distributor Name"
      );

      if (name === null) return;

      const location = requiredText(
        distributor.location,
        "Distributor Location"
      );

      if (location === null) return;

      const licenseNo = requiredText(
        distributor.licenseNo,
        "Distributor License No."
      );

      if (licenseNo === null) return;

      console.log(
        "addDistributor arguments:",
        {
          id,
          name,
          location,
          licenseNo,
          manufacturerId,
        }
      );

      const txPromise =
        contract.addDistributor(
          id,
          name,
          location,
          licenseNo,
          manufacturerId
        );

      await handleTx(
        txPromise,
        "Distributor Added!",
        "Distributor",
        "addDistributor"
      );
    } catch (err) {
      console.error(
        "Distributor error:",
        err
      );

      alert(
        `Distributor transaction failed:\n${
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          err
        }`
      );
    }
  };

  // ==========================================================
  // PHARMACY
  // ==========================================================

  const addPharmacy = async () => {
    try {
      if (!contract) {
        alert("Connect MetaMask first.");
        return;
      }

      const id = toUint(
        pharmacy.id,
        "Pharmacy ID"
      );

      if (id === null) return;

      const distributorId = toUint(
        pharmacy.distributorId,
        "Distributor ID"
      );

      if (distributorId === null) return;

      const name = requiredText(
        pharmacy.name,
        "Pharmacy Name"
      );

      if (name === null) return;

      const location = requiredText(
        pharmacy.location,
        "Pharmacy Location"
      );

      if (location === null) return;

      const licenseNo = requiredText(
        pharmacy.licenseNo,
        "Pharmacy License No."
      );

      if (licenseNo === null) return;

      console.log(
        "addPharmacy arguments:",
        {
          id,
          name,
          location,
          licenseNo,
          distributorId,
        }
      );

      const txPromise =
        contract.addPharmacy(
          id,
          name,
          location,
          licenseNo,
          distributorId
        );

      await handleTx(
        txPromise,
        "Pharmacy Added!",
        "Pharmacy",
        "addPharmacy"
      );
    } catch (err) {
      console.error(
        "Pharmacy error:",
        err
      );

      alert(
        `Pharmacy transaction failed:\n${
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          err
        }`
      );
    }
  };

  // ==========================================================
  // CUSTOMER
  // ==========================================================

  const addCustomer = async () => {
    try {
      if (!contract) {
        alert("Connect MetaMask first.");
        return;
      }

      const id = toUint(
        customer.id,
        "Customer ID"
      );

      if (id === null) return;

      const pharmacyId = toUint(
        customer.pharmacyId,
        "Pharmacy ID"
      );

      if (pharmacyId === null) return;

      const name = requiredText(
        customer.name,
        "Customer Name"
      );

      if (name === null) return;

      const contactInfo = requiredText(
        customer.contactInfo,
        "Customer Contact Info"
      );

      if (contactInfo === null) return;

      console.log(
        "addCustomer arguments:",
        {
          id,
          name,
          contactInfo,
          pharmacyId,
        }
      );

      const txPromise =
        contract.addCustomer(
          id,
          name,
          contactInfo,
          pharmacyId
        );

      await handleTx(
        txPromise,
        "Customer Added!",
        "Customer",
        "addCustomer"
      );
    } catch (err) {
      console.error(
        "Customer error:",
        err
      );

      alert(
        `Customer transaction failed:\n${
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          err
        }`
      );
    }
  };

  // ==========================================================
  // LOT
  // ==========================================================

  const addLot = async () => {
    try {
      if (!contract) {
        alert("Connect MetaMask first.");
        return;
      }

      const lotId = toUint(
        lot.lotId,
        "Lot ID"
      );

      if (lotId === null) return;

      const quantity = toUint(
        lot.quantity,
        "Quantity"
      );

      if (quantity === null) return;

      const manufacturerId = toUint(
        lot.manufacturerId,
        "Manufacturer ID"
      );

      if (manufacturerId === null) return;

      const drugName = requiredText(
        lot.drugName,
        "Drug Name"
      );

      if (drugName === null) return;

      const mfgDate = requiredText(
        lot.mfgDate,
        "Manufacture Date"
      );

      if (mfgDate === null) return;

      const expDate = requiredText(
        lot.expDate,
        "Expiry Date"
      );

      if (expDate === null) return;

      console.log(
        "addLot arguments:",
        {
          lotId,
          drugName,
          quantity,
          mfgDate,
          expDate,
          manufacturerId,
        }
      );

      /*
       * IMPORTANT:
       *
       * The ABI has addLot(), NOT addLotBatch().
       */
      const txPromise =
        contract.addLot(
          lotId,
          drugName,
          quantity,
          mfgDate,
          expDate,
          manufacturerId
        );

      await handleTx(
        txPromise,
        "Lot Added!",
        "Lot",
        "addLot"
      );
    } catch (err) {
      console.error(
        "Lot error:",
        err
      );

      alert(
        `Lot transaction failed:\n${
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          err
        }`
      );
    }
  };

  // ==========================================================
  // SHIPMENT
  // ==========================================================

  const addShipment = async () => {
    try {
      if (!contract) {
        alert("Connect MetaMask first.");
        return;
      }

      const shipmentId = toUint(
        shipment.shipmentId,
        "Shipment ID"
      );

      if (shipmentId === null) return;

      const lotId = toUint(
        shipment.lotId,
        "Lot ID"
      );

      if (lotId === null) return;

      const sourceId = toUint(
        shipment.sourceId,
        "Source ID"
      );

      if (sourceId === null) return;

      const destinationId = toUint(
        shipment.destinationId,
        "Destination ID"
      );

      if (destinationId === null) return;

      const shipDate = requiredText(
        shipment.shipDate,
        "Shipment Date"
      );

      if (shipDate === null) return;

      const status = requiredText(
        shipment.status,
        "Shipment Status"
      );

      if (status === null) return;

      console.log(
        "addShipment arguments:",
        {
          shipmentId,
          lotId,
          sourceId,
          destinationId,
          shipDate,
          status,
        }
      );

      const txPromise =
        contract.addShipment(
          shipmentId,
          lotId,
          sourceId,
          destinationId,
          shipDate,
          status
        );

      await handleTx(
        txPromise,
        "Shipment Added!",
        "Shipment",
        "addShipment"
      );
    } catch (err) {
      console.error(
        "Shipment error:",
        err
      );

      alert(
        `Shipment transaction failed:\n${
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          err
        }`
      );
    }
  };

  // ==========================================================
  // AUDIT LOG
  // ==========================================================

  const addAuditLog = async () => {
    try {
      if (!contract) {
        alert("Connect MetaMask first.");
        return;
      }

      const auditId = toUint(
        audit.auditId,
        "Audit ID"
      );

      if (auditId === null) return;

      const userId = toUint(
        audit.userId,
        "User ID"
      );

      if (userId === null) return;

      const entity = requiredText(
        audit.entity,
        "Entity"
      );

      if (entity === null) return;

      const action = requiredText(
        audit.action,
        "Action"
      );

      if (action === null) return;

      const timestamp = requiredText(
        audit.timestamp,
        "Timestamp"
      );

      if (timestamp === null) return;

      console.log(
        "addAuditLog arguments:",
        {
          auditId,
          entity,
          action,
          timestamp,
          userId,
        }
      );

      const txPromise =
        contract.addAuditLog(
          auditId,
          entity,
          action,
          timestamp,
          userId
        );

      await handleTx(
        txPromise,
        "Audit Log Added!",
        "AuditLog",
        "addAuditLog"
      );
    } catch (err) {
      console.error(
        "Audit Log error:",
        err
      );

      alert(
        `Audit Log transaction failed:\n${
          err?.reason ||
          err?.shortMessage ||
          err?.message ||
          err
        }`
      );
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-10">

      <h1 className="text-3xl font-bold">
        Drug Supply Chain DApp
      </h1>

      {/* ======================================================
          WALLET
          ====================================================== */}

      {!currentAccount ? (
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Connect MetaMask
        </button>
      ) : (
        <div>
          <p className="mb-2">
            Connected Wallet:
          </p>

          <p className="break-all font-mono text-sm">
            {currentAccount}
          </p>
        </div>
      )}

      {/* ======================================================
          DISABLE FORMS UNTIL CONTRACT IS READY
          ====================================================== */}

      <fieldset
        disabled={!contract}
        className={
          !contract
            ? "opacity-50"
            : ""
        }
      >

        {/* ====================================================
            MANUFACTURER
            ==================================================== */}

        <section>
          <h2 className="text-xl font-semibold">
            Add Manufacturer
          </h2>

          {Object.keys(manufacturer).map(
            (key) => (
              <input
                key={key}
                placeholder={key}
                value={manufacturer[key]}
                onChange={(e) =>
                  setManufacturer({
                    ...manufacturer,
                    [key]:
                      e.target.value,
                  })
                }
              />
            )
          )}

          <button
            onClick={addManufacturer}
          >
            Add Manufacturer
          </button>
        </section>

        {/* ====================================================
            SUPPLIER
            ==================================================== */}

        <section>
          <h2 className="text-xl font-semibold">
            Add Supplier
          </h2>

          {Object.keys(supplier).map(
            (key) => (
              <input
                key={key}
                placeholder={key}
                value={supplier[key]}
                onChange={(e) =>
                  setSupplier({
                    ...supplier,
                    [key]:
                      e.target.value,
                  })
                }
              />
            )
          )}

          <button
            onClick={addSupplier}
          >
            Add Supplier
          </button>
        </section>

        {/* ====================================================
            DISTRIBUTOR
            ==================================================== */}

        <section>
          <h2 className="text-xl font-semibold">
            Add Distributor
          </h2>

          {Object.keys(distributor).map(
            (key) => (
              <input
                key={key}
                placeholder={key}
                value={distributor[key]}
                onChange={(e) =>
                  setDistributor({
                    ...distributor,
                    [key]:
                      e.target.value,
                  })
                }
              />
            )
          )}

          <button
            onClick={addDistributor}
          >
            Add Distributor
          </button>
        </section>

        {/* ====================================================
            PHARMACY
            ==================================================== */}

        <section>
          <h2 className="text-xl font-semibold">
            Add Pharmacy
          </h2>

          {Object.keys(pharmacy).map(
            (key) => (
              <input
                key={key}
                placeholder={key}
                value={pharmacy[key]}
                onChange={(e) =>
                  setPharmacy({
                    ...pharmacy,
                    [key]:
                      e.target.value,
                  })
                }
              />
            )
          )}

          <button
            onClick={addPharmacy}
          >
            Add Pharmacy
          </button>
        </section>

        {/* ====================================================
            CUSTOMER
            ==================================================== */}

        <section>
          <h2 className="text-xl font-semibold">
            Add Customer
          </h2>

          {Object.keys(customer).map(
            (key) => (
              <input
                key={key}
                placeholder={key}
                value={customer[key]}
                onChange={(e) =>
                  setCustomer({
                    ...customer,
                    [key]:
                      e.target.value,
                  })
                }
              />
            )
          )}

          <button
            onClick={addCustomer}
          >
            Add Customer
          </button>
        </section>

        {/* ====================================================
            LOT
            ==================================================== */}

        <section>
          <h2 className="text-xl font-semibold">
            Add Lot Batch
          </h2>

          {Object.keys(lot).map(
            (key) => (
              <input
                key={key}
                placeholder={key}
                value={lot[key]}
                onChange={(e) =>
                  setLot({
                    ...lot,
                    [key]:
                      e.target.value,
                  })
                }
              />
            )
          )}

          <button onClick={addLot}>
            Add Lot
          </button>
        </section>

        {/* ====================================================
            SHIPMENT
            ==================================================== */}

        <section>
          <h2 className="text-xl font-semibold">
            Add Shipment
          </h2>

          {Object.keys(shipment).map(
            (key) => (
              <input
                key={key}
                placeholder={key}
                value={shipment[key]}
                onChange={(e) =>
                  setShipment({
                    ...shipment,
                    [key]:
                      e.target.value,
                  })
                }
              />
            )
          )}

          <button
            onClick={addShipment}
          >
            Add Shipment
          </button>
        </section>

        {/* ====================================================
            AUDIT LOG
            ==================================================== */}

        <section>
          <h2 className="text-xl font-semibold">
            Add Audit Log
          </h2>

          {Object.keys(audit).map(
            (key) => (
              <input
                key={key}
                placeholder={key}
                value={audit[key]}
                onChange={(e) =>
                  setAudit({
                    ...audit,
                    [key]:
                      e.target.value,
                  })
                }
              />
            )
          )}

          <button
            onClick={addAuditLog}
          >
            Add Audit
          </button>
        </section>

      </fieldset>

      {/* ======================================================
          IPFS RESULT
          ====================================================== */}

      {ipfsUrl && (
        <section className="mt-6">
          <h2 className="text-xl font-semibold">
            Latest IPFS Record
          </h2>

          <p>
            <strong>CID:</strong>{" "}
            {ipfsCid}
          </p>

          <p>
            <strong>Link:</strong>{" "}
            <a
              href={ipfsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {ipfsUrl}
            </a>
          </p>
        </section>
      )}

    </div>
  );
}

export default App;