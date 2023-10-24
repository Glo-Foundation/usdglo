import * as dotenv from "dotenv";

import { ethers, upgrades } from "hardhat";

async function main() {
  const upgradeContractName = process.env.UPGRADE_CONTRACT_NAME as string;
  const proxyAddress = process.env.PROXY_ADDRESS as string;

  const [deployerSigner] = await ethers.getSigners();

  const UpgradedUSDGlobalIncomeCoin = await ethers.getContractFactory(
    upgradeContractName,
    deployerSigner
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
