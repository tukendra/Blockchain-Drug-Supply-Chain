import { create } from "ipfs-http-client";

// connect to IPFS Desktop API
const ipfs = create({
  host: "127.0.0.1",
  port: 5001,
  protocol: "http",
});

// Function to upload plain text
async function uploadTextToIPFS(text) {
  try {
    const { path } = await ipfs.add(text);
    console.log("Uploaded to IPFS");
    console.log("CID:", ipfsCid.toString());
    console.log("Public Gateway URL: https://ipfs.io/ipfs/" + ipfsCid.toString());
    return path;
  } catch (error) {
    console.error("Upload failed:", error);
  }
}

const handleTx = async () => {
  try {
    if (!contract) return;

    // Example: create a file buffer
    const fileContent = "Hello from Drug Supply Chain!";
    const result = await ipfs.add(fileContent);

    console.log("Raw IPFS response:", result);

    const cidStr = result.ipfsCid.toString(); // This will NOT be undefined
    console.log("CID String:", cidStr);

    // Save on blockchain
    const tx = await contract.addIPFSFile(
      cidStr,
      0,
      "txHash",
      new Date().toISOString()
    );
    await tx.wait();

    // Generate usable IPFS gateway link
    const ipfsLink = `https://ipfs.io/ipfs/${cidStr}`;
    console.log("🔗 IPFS Gateway Link:", ipfsLink);
  } catch (error) {
    console.error("Transaction failed:", error);
  }
};

// Test run
uploadTextToIPFS("Hello from IPFS Desktop");
