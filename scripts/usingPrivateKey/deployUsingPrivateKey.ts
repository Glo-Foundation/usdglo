import * as dotenv from "dotenv";
import { ethers, upgrades } from "hardhat";

async function main() {
  const initialAdminAddress = process.env.INITIAL_ADMIN_ADDRESS;

  const [deployerSigner] = await ethers.getSigners();

  const USDGlobalIncomeCoin = await ethers.getContractFactory(
    "USDGlobalIncomeCoin",
    deployerSigner
  );
  const usdGlobalIncomeCoin = await upgrades.deployProxy(
    USDGlobalIncomeCoin,
    [initialAdminAddress],
    { kind: "uups" }
  );
  await usdGlobalIncomeCoin.deployed();

  const proxyAddress = usdGlobalIncomeCoin.address;
  console.log(`USDGlobalIncomeCoin Proxy: ${proxyAddress}`);

  const currentImplAddress = await upgrades.erc1967.getImplementationAddress(
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
