import * as dotenv from "dotenv";

import { ethers, upgrades } from "hardhat";
const hre = require("hardhat");

async function main() {
  const upgradeContractName = process.env.UPGRADE_CONTRACT_NAME as string;
  const proxyAddress = process.env.PROXY_ADDRESS as string;

  const UPGRADER_ACCOUNT = "0xDf04400bBE27Cbe51F53737AFC446c04F355cC5B";

  const [alice] = await ethers.getSigners();

  await alice.sendTransaction({
    to: UPGRADER_ACCOUNT,
    value: ethers.utils.parseEther("10.0"), // Sends exactly 1.0 ether
  });

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [UPGRADER_ACCOUNT],
  });
  const signer = await ethers.provider.getSigner(UPGRADER_ACCOUNT);

  const UpgradedUSDGlobalIncomeCoin = await ethers.getContractFactory(
    upgradeContractName,
    signer
  );

  const upgraded = await upgrades.upgradeProxy(
    proxyAddress,
    UpgradedUSDGlobalIncomeCoin
  );
  console.log(`upgraded: ${upgraded}`);
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
