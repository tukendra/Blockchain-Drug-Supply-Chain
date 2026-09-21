const { create } = require('ipfs-http-client');

// connect to local IPFS
const client = create({ url: 'http://127.0.0.1:5001' });

async function uploadFile() {
  const { cid } = await client.add("Hello Pharma Supply Chain!");
  console.log("File CID:", cid.toString());
}

uploadFile();