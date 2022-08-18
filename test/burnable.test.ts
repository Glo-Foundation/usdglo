import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployUSDGLOFixture } from "./fixtures";
import { ethers } from "hardhat";

import {
  getAccessControlRevertMessage,
  MINTER_ROLE,
  PAUSER_ROLE,
  DENYLISTER_ROLE,
  MINTER_ROLE_NAME,
} from "./utils";

describe("burn functionality of USDGLO", function () {
  describe("role behaviour", function () {
    it("revert burn if called by address without MINTER_ROLE", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      const amount = 100_000;

      const expectedRevertMessage = getAccessControlRevertMessage(
        MINTER_ROLE_NAME,
        user.address
      );
      await expect(usdglo.connect(user).burn(amount)).to.be.revertedWith(
        expectedRevertMessage
      );
    });

    it("successful burn if called by address with MINTER_ROLE", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user.address);

      const amount = 100_000;

      await usdglo.connect(user).mint(user.address, amount);

      expect(await usdglo.balanceOf(user.address)).to.equal(amount);
      await usdglo.connect(user).burn(amount);
      expect(await usdglo.balanceOf(user.address)).to.equal(0);
    });
  });

  describe("event behaviour", function () {
    it("emits Transfer and Burn events on successful burn", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user.address);

      const amount = 100_000;

      await usdglo.connect(user).mint(user.address, amount);

      await expect(usdglo.connect(user).burn(amount))
        .to.emit(usdglo, "Transfer")
        .withArgs(user.address, ethers.constants.AddressZero, amount)
        .to.emit(usdglo, "Burn")
        .withArgs(user.address, amount);
    });
  });

  describe("paused behaviour", function () {
    it("reverts burn if USDGLO is paused", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user.address);
      await usdglo.connect(admin).grantRole(PAUSER_ROLE, user.address);

      const amount = 100_000;

      await usdglo.connect(user).mint(user.address, amount);

      await usdglo.connect(user).pause();

      await expect(usdglo.connect(user).burn(amount)).to.be.revertedWith(
        "Pausable: paused"
      );
    });
  });

  describe("denylisted behaviour", function () {
    it("reverts burn if burner is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user.address);

      const amount = 100_000;

      await usdglo.connect(user).mint(user.address, amount);

      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, admin.address);
      await usdglo.connect(admin).denylist(user.address);

      await expect(usdglo.connect(user).burn(amount))
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user.address);
    });
  });

  describe("misc behaviour", function () {
    it("reverts burn if burn amount exceeds balance", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);

      await usdglo.connect(admin).grantRole(MINTER_ROLE, admin.address);

      const amount = 1;

      await expect(usdglo.connect(admin).burn(amount)).to.be.revertedWith(
        "ERC20: burn amount exceeds balance"
      );
    });
  });
});
