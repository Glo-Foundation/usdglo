import * as dotenv from "dotenv";
import { ethers, upgrades } from "hardhat";
import { getImplementationAddress } from "@openzeppelin/upgrades-core";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";

async function main() {
  const credentials = {
    apiKey: process.env.RELAYER_DEPLOYER_KEY as string,
    apiSecret: process.env.RELAYER_DEPLOYER_SECRET as string,
  };
  const initialAdminAddress = process.env.INITIAL_ADMIN_ADDRESS;

  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });

  const USDGlobalIncomeCoin = await ethers.getContractFactory(
    "USDGlobalIncomeCoin",
    relaySigner
  );
  const usdGlobalIncomeCoin = await upgrades.deployProxy(
    USDGlobalIncomeCoin,
    [initialAdminAddress],
    { kind: "uups" }
  );
  await usdGlobalIncomeCoin.deployed();

  const proxyAddress = usdGlobalIncomeCoin.address;
  console.log(`USDGlobalIncomeCoin Proxy: ${proxyAddress}`);

  const currentImplAddress = await getImplementationAddress(
    provider,
    proxyAddress
  );
  console.log(`USDGlobalIncomeCoin Implementation: ${currentImplAddress}`);
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
