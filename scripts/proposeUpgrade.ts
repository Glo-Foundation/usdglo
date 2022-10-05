import * as dotenv from "dotenv";

const { defender } = require("hardhat");
import { ethers } from "hardhat";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";

async function main() {
  const upgradeContractName = process.env.UPGRADE_CONTRACT_NAME as string;
  const proxyAddress = process.env.PROXY_ADDRESS;

  const credentials = {
    apiKey: process.env.RELAYER_DEPLOYER_KEY as string,
    apiSecret: process.env.RELAYER_DEPLOYER_SECRET as string,
  };

  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });

  const UpgradedUSDGlobalIncomeCoin = await ethers.getContractFactory(
    upgradeContractName,
    relaySigner
  );
  const proposal = await defender.proposeUpgrade(
    proxyAddress,
    UpgradedUSDGlobalIncomeCoin,
    {
      kind: "uups",
      multisig: process.env.UPGRADE_MULTISIG,
      multisigType: "Gnosis Safe",
    }
  );
  console.log(`Upgrade proposal created at: ${proposal.url}`);
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
