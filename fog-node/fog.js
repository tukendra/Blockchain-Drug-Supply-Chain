import { ethers } from "ethers";
import { create } from "ipfs-http-client";
import contractABI from "./DrugSupplyChain.json" assert { type: "json" };
import dotenv from "dotenv";

dotenv.config();

// Setup Provider + Wallet
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract Instance
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI.abi,
  wallet
);

// Setup IPFS
const ipfs = create({ url: "http://127.0.0.1:5001/api/v0" });

// Dummy shipment data
const shipment = {
  shipmentId,
  lotId,
  sourceId,
  destinationId,
  shipDate: new Date().toISOString(),
  status: "In Transit"
};

async function main() {
  // 1. Upload data to IPFS
  const { path } = await ipfs.add(JSON.stringify(shipment));
  console.log("IPFS CID:", path);

  // 2. Save to Blockchain
  const tx = await contract.addShipment(
    shipment.shipmentId,
    shipment.lotId,
    shipment.sourceId,
    shipment.destinationId,
    shipment.shipDate,
    shipment.status
  );

  console.log("Waiting for confirmation...");
  await tx.wait();
  console.log("Shipment added! Tx hash:", tx.hash);
}

main().catch(console.error);
