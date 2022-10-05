import * as dotenv from "dotenv";

const { upgrades } = require("hardhat");
import { ethers } from "hardhat";

async function main() {
  const currentContractName = process.env.CURRENT_CONTRACT_NAME as string;
  const proxyAddress = process.env.PROXY_ADDRESS;

  const CurrentUSDGlobalIncomeCoin = await ethers.getContractFactory(
    currentContractName
  );
  await upgrades.forceImport(proxyAddress, CurrentUSDGlobalIncomeCoin, {
    kind: "uups",
  });
  console.log("Updated .openzeppelin");
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
