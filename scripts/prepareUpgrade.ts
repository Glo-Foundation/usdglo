import * as dotenv from "dotenv";

import { ethers, upgrades } from "hardhat";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";

async function main() {
  const upgradeContractName = process.env.UPGRADE_CONTRACT_NAME as string;
  const proxyAddress = process.env.PROXY_ADDRESS as string;

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
  const newImplementationAddress = await upgrades.prepareUpgrade(
    proxyAddress,
    UpgradedUSDGlobalIncomeCoin,
    {
      kind: "uups",
    }
  );
  console.log(`New implementation address: ${newImplementationAddress}`);
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
