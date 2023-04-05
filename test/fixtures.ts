import { ethers, upgrades } from "hardhat";
import { PAUSER_ROLE, UPGRADER_ROLE } from "./utils";

export async function deployUSDGLOFixture() {
  const [admin] = await ethers.getSigners();
  const USDGLO_V1 = await ethers.getContractFactory(
    "USDGlobalIncomeCoin",
    admin
  );

  const usdgloV1 = await upgrades.deployProxy(USDGLO_V1, [admin.address], {
    kind: "uups",
  });
  await usdgloV1.deployed();

  await usdgloV1.connect(admin).grantRole(PAUSER_ROLE, admin.address);
  await usdgloV1.connect(admin).pause();

  await usdgloV1.connect(admin).grantRole(UPGRADER_ROLE, admin.address);

  const USDGLO_V2 = await ethers.getContractFactory(
    "USDGlobalIncomeCoinV2",
    admin
  );

  const usdglo = await upgrades.upgradeProxy(usdgloV1.address, USDGLO_V2, {
    kind: "uups",
  });

  await usdglo.connect(admin).unpause();

  return { usdglo, admin };
}

export async function deployMockUSDGLOFixture() {
  const [admin] = await ethers.getSigners();
  const USDGLO = await ethers.getContractFactory(
    "MockUSDGlobalIncomeCoinV2",
    admin
  );

  const usdglo = await upgrades.deployProxy(USDGLO, [admin.address], {
    kind: "uups",
  });
  await usdglo.deployed();

  return { usdglo, admin };
}
