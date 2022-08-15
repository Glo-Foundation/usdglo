import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployUSDGLOFixture } from "./fixtures";
import { ethers } from "hardhat";

import {
  getAccessControlRevertMessage,
  PAUSER_ROLE,
  PAUSER_ROLE_NAME,
} from "./utils";

describe("pausable functionality of USDGLO", function () {
  describe("role behaviour", function () {
    it("reverts pause if called by address without PAUSER_ROLE", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      const expectedRevertMessage = getAccessControlRevertMessage(
        PAUSER_ROLE_NAME,
        user.address
      );
      await expect(usdglo.connect(user).pause()).to.be.revertedWith(
        expectedRevertMessage
      );
    });

    it("successful pause if called by address with PAUSER_ROLE", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(PAUSER_ROLE, user.address);

      expect(await usdglo.paused()).to.be.false;
      await usdglo.connect(user).pause();
      expect(await usdglo.paused()).to.be.true;
    });

    it("reverts unpause if called by address without PAUSER_ROLE", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      const expectedRevertMessage = getAccessControlRevertMessage(
        PAUSER_ROLE_NAME,
        user.address
      );
      await expect(usdglo.connect(user).unpause()).to.be.revertedWith(
        expectedRevertMessage
      );
    });

    it("successful unpause if called by address with PAUSER_ROLE", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(PAUSER_ROLE, user.address);

      await usdglo.connect(user).pause();
      expect(await usdglo.paused()).to.be.true;
      await usdglo.connect(user).unpause();
      expect(await usdglo.paused()).to.be.false;
    });
  });

  describe("event behaviour", function () {
    it("emits Paused event on pause", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(PAUSER_ROLE, user.address);

      await expect(usdglo.connect(user).pause())
        .to.emit(usdglo, "Paused")
        .withArgs(user.address);
    });

    it("emits Unpaused event on unpause", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(PAUSER_ROLE, user.address);

      await usdglo.connect(user).pause();
      await expect(usdglo.connect(user).unpause())
        .to.emit(usdglo, "Unpaused")
        .withArgs(user.address);
    });
  });
});
