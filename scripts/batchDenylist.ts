import * as dotenv from "dotenv";

const { AdminClient } = require("defender-admin-client");
import { readFileSync } from "fs";
import { Network } from "defender-base-client/lib/utils/network";

async function main() {
  const denylistFile = process.env.DENYLIST_FILE as string;
  const denylistAddresses = readFileSync(denylistFile, "utf-8").split("\n");

  const USDGLOProxyAddress = process.env.PROXY_ADDRESS;
  const network = process.env.HARDHAT_NETWORK as Network;

  const contracts = [
    {
      address: USDGLOProxyAddress,
      network: network,
    },
  ];

  let denylistTransactions = [];
  for (let idx = 0; idx < denylistAddresses.length; idx++) {
    const denylistTransaction = {
      contractId: `${network}-${USDGLOProxyAddress}`,
      targetFunction: {
        name: "denylist",
        inputs: [{ type: "address", name: "denylistee" }],
      },
      functionInputs: [denylistAddresses[idx]],
      type: "custom",
    };
    denylistTransactions.push(denylistTransaction);
  }

  const defenderCredentials = {
    apiKey: process.env.DEFENDER_API_KEY,
    apiSecret: process.env.DEFENDER_API_SECRET,
  };
  const adminClient = new AdminClient(defenderCredentials);

  await adminClient.createProposal({
    contract: contracts,
    title: process.env.DENYLIST_TITLE,
    description: process.env.DENYLIST_DESCRIPTION,
    type: "batch",
    via: process.env.DENYLIST_MULTISIG,
    viaType: "Gnosis Safe",
    metadata: {}, // Required field but empty
    steps: denylistTransactions,
  });
}

if (require.main === module) {
  dotenv.config();
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
