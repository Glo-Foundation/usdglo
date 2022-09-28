import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployUSDGLOFixture } from "./fixtures";
import { ethers, upgrades } from "hardhat";

import {
  getAccessControlRevertMessage,
  UPGRADER_ROLE_NAME,
  UPGRADER_ROLE,
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
  });
});
