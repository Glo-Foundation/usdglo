import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployUSDGLOFixture } from "./fixtures";
import { ethers, upgrades } from "hardhat";

import {
  getAccessControlRevertMessage,
  UPGRADER_ROLE_NAME,
  UPGRADER_ROLE,
  PAUSER_ROLE,
} from "./utils";

describe("upgradeable functionality of USDGLO", function () {
  describe("role behaviour", function () {
    it("reverts upgrade if called by address without UPGRADER_ROLE", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      const USDGLOV2 = await ethers.getContractFactory(
        "USDGlobalIncomeCoin",
        user
      );

      const expectedRevertMessage = getAccessControlRevertMessage(
        UPGRADER_ROLE_NAME,
        user.address
      );

      await expect(
        upgrades.upgradeProxy(usdglo, USDGLOV2, { kind: "uups" })
      ).to.be.revertedWith(expectedRevertMessage);
    });

    it("successful upgrade if called by address with UPGRADER_ROLE", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      const USDGLOV2 = await ethers.getContractFactory(
        "USDGlobalIncomeCoin",
        user
      );

      await usdglo.connect(admin).grantRole(UPGRADER_ROLE, user.address);

      await upgrades.upgradeProxy(usdglo, USDGLOV2, { kind: "uups" });
    });

    it("successful upgrade if called by address with UPGRADER_ROLE - 2", async function () {
      const [admin] = await ethers.getSigners();
      const USDGLO_V1 = await ethers.getContractFactory(
        "USDGlobalIncomeCoin",
        admin
      );

      const usdgloV1 = await upgrades.deployProxy(USDGLO_V1, [admin.address], {
        kind: "uups",
      });
      await usdgloV1.deployed();

      expect(await usdgloV1.paused()).to.be.false;
      await usdgloV1.connect(admin).grantRole(PAUSER_ROLE, admin.address);
      await usdgloV1.connect(admin).pause();
      expect(await usdgloV1.paused()).to.be.true;

      await usdgloV1.connect(admin).grantRole(UPGRADER_ROLE, admin.address);

      const USDGLOV2 = await ethers.getContractFactory(
        "USDGlobalIncomeCoinV2",
        admin
      );

      const usdgloV2 = await upgrades.upgradeProxy(usdgloV1.address, USDGLOV2, {
        kind: "uups",
      });

      expect(await usdgloV2.paused()).to.be.true;
      await usdgloV2.connect(admin).unpause();
      expect(await usdgloV2.paused()).to.be.false;
    });
  });
});
