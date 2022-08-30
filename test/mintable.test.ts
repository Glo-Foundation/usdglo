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

describe("mintable functionality of USDGLO", function () {
  describe("role behaviour", function () {
    it("reverts mint if called by address without MINTER_ROLE", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      const amount = 100_000;
      const expectedRevertMessage = getAccessControlRevertMessage(
        MINTER_ROLE_NAME,
        user1.address
      );
      await expect(
        usdglo.connect(user1).mint(user2.address, amount)
      ).to.be.revertedWith(expectedRevertMessage);
    });

    it("successful mint if called by address with MINTER_ROLE", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);

      const amount = 100_000;

      await usdglo.connect(user1).mint(user2.address, amount);
      expect(await usdglo.balanceOf(user2.address)).to.equal(amount);
    });

    it("reverts mint if it makes totalSupply go over 2^255 - 1", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);

      const amount = 1n << 255n;

      await expect(usdglo.connect(user1).mint(user2.address, amount))
        .to.be.revertedWithCustomError(usdglo, "IsOverSupplyCap")
        .withArgs(amount);
      expect(await usdglo.balanceOf(user2.address)).to.equal(0);
    });
  });

  describe("event behaviour", function () {
    it("emits Transfer and Mint events on mint", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);

      const amount = 100_000;

      await expect(usdglo.connect(user1).mint(user2.address, amount))
        .to.emit(usdglo, "Transfer")
        .withArgs(ethers.constants.AddressZero, user2.address, amount)
        .to.emit(usdglo, "Mint")
        .withArgs(user1.address, user2.address, amount);
    });
  });

  describe("paused behaviour", function () {
    it("reverts mint if USDGLO is paused", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(PAUSER_ROLE, user1.address);
      await usdglo.connect(user1).pause();

      const amount = 100_000;

      await expect(
        usdglo.connect(user1).mint(user2.address, amount)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("denylisted behaviour", function () {
    it("reverts mint if minter is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, admin.address);
      await usdglo.connect(admin).denylist(user1.address);

      const amount = 100_000;

      await expect(usdglo.connect(user1).mint(user2.address, amount))
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user1.address);
    });

    it("reverts mint if mintee is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);
      await usdglo.connect(user1).denylist(user2.address);

      const amount = 100_000;

      await expect(usdglo.connect(user1).mint(user2.address, amount))
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user2.address);
    });
  });

  describe("misc behaviour", function () {
    it("mint must revert if mintee is zero address", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);

      await usdglo.connect(admin).grantRole(MINTER_ROLE, admin.address);

      const amount = 1;

      await expect(
        usdglo.connect(admin).mint(ethers.constants.AddressZero, amount)
      ).to.be.revertedWith("ERC20: mint to the zero address");
    });
  });
});
