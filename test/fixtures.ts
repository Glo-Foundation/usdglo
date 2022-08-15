import { ethers, upgrades } from "hardhat";

export async function deployUSDGLOFixture() {
  const [admin] = await ethers.getSigners();
  const USDGLO = await ethers.getContractFactory("USDGlobalIncomeCoin", admin);

  const usdglo = await upgrades.deployProxy(USDGLO, []);
  await usdglo.deployed();

  return { usdglo, admin };
}
