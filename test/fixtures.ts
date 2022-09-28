import { ethers, upgrades } from "hardhat";

export async function deployUSDGLOFixture() {
  const [admin] = await ethers.getSigners();
  const USDGLO = await ethers.getContractFactory("USDGlobalIncomeCoin", admin);

  const usdglo = await upgrades.deployProxy(USDGLO, [admin.address], {
    kind: "uups",
  });
  await usdglo.deployed();

  return { usdglo, admin };
}

export async function deployMockUSDGLOFixture() {
  const [admin] = await ethers.getSigners();
  const USDGLO = await ethers.getContractFactory(
    "MockUSDGlobalIncomeCoin",
    admin
  );

  const usdglo = await upgrades.deployProxy(USDGLO, [admin.address], {
    kind: "uups",
  });
  await usdglo.deployed();

  return { usdglo, admin };
}
