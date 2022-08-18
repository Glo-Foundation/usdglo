import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployUSDGLOFixture } from "./fixtures";
import { ethers } from "hardhat";

import { MINTER_ROLE, PAUSER_ROLE, DENYLISTER_ROLE } from "./utils";

describe("approve functionality of USDGLO", function () {
  describe("paused behaviour", function () {
    it("reverts approve if USDGLO is paused", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(PAUSER_ROLE, user1.address);

      await usdglo.connect(user1).pause();

      const amount = 100_000;

      await expect(
        usdglo.connect(user1).approve(user2.address, amount)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("denylisted behaviour", function () {
    it("reverts approve if sender is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, admin.address);

      await usdglo.connect(admin).denylist(user1.address);

      const amount = 100_000;

      await expect(usdglo.connect(user1).approve(user2.address, amount))
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user1.address);
    });

    it("reverts approve if receiver is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      await usdglo.connect(user1).denylist(user2.address);

      const amount = 100_000;

      await expect(usdglo.connect(user1).approve(user2.address, amount))
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user2.address);
    });
  });

  describe("misc behaviour", function () {
    it("infinite allowance must never reduce with use", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, admin.address);

      const infiniteAmount = ethers.constants.MaxUint256;

      await usdglo.connect(user1).approve(user2.address, infiniteAmount);
      expect(await usdglo.allowance(user1.address, user2.address)).to.equal(
        infiniteAmount
      );
      await usdglo.connect(admin).mint(user1.address, 100_000);
      expect(await usdglo.balanceOf(admin.address)).to.equal(0);
      expect(await usdglo.balanceOf(user1.address)).to.equal(100_000);
      expect(await usdglo.balanceOf(user2.address)).to.equal(0);
      await usdglo
        .connect(user2)
        .transferFrom(user1.address, admin.address, 100_000);
      expect(await usdglo.balanceOf(admin.address)).to.equal(100_000);
      expect(await usdglo.balanceOf(user1.address)).to.equal(0);
      expect(await usdglo.balanceOf(user2.address)).to.equal(0);
      expect(await usdglo.allowance(user1.address, user2.address)).to.equal(
        infiniteAmount
      );
    });

    it("approve must fail if spender is zero address", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);

      const amount = 1;

      await expect(
        usdglo.connect(admin).approve(ethers.constants.AddressZero, amount)
      ).to.be.revertedWith("ERC20: approve to the zero address");
    });
  });
});

describe("increaseAllowance functionality of USDGLO", function () {
  describe("paused behaviour", function () {
    it("reverts increaseAllowance if USDGLO is paused", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(PAUSER_ROLE, user1.address);

      await usdglo.connect(user1).pause();

      const amount = 100_000;

      await expect(
        usdglo.connect(user1).increaseAllowance(user2.address, amount)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("denylisted behaviour", function () {
    it("reverts increaseAllowance if sender is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, admin.address);

      await usdglo.connect(admin).denylist(user1.address);

      const amount = 100_000;

      await expect(
        usdglo.connect(user1).increaseAllowance(user2.address, amount)
      )
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user1.address);
    });

    it("reverts increaseAllowance if receiver is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      await usdglo.connect(user1).denylist(user2.address);

      const amount = 100_000;

      await expect(
        usdglo.connect(user1).increaseAllowance(user2.address, amount)
      )
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user2.address);
    });
  });
});

describe("decreaseAllowance functionality of USDGLO", function () {
  describe("paused behaviour", function () {
    it("reverts decreaseAllowance if USDGLO is paused", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(PAUSER_ROLE, user1.address);

      const amount = 100_000;

      await usdglo.connect(user1).increaseAllowance(user2.address, amount);
      await usdglo.connect(user1).pause();

      await expect(
        usdglo.connect(user1).decreaseAllowance(user2.address, amount)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("denylisted behaviour", function () {
    it("reverts decreaseAllowance if sender is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, admin.address);

      const amount = 100_000;

      await usdglo.connect(user1).increaseAllowance(user2.address, amount);
      await usdglo.connect(admin).denylist(user1.address);

      await expect(
        usdglo.connect(user1).decreaseAllowance(user2.address, amount)
      )
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user1.address);
    });

    it("reverts decreaseAllowance if receiver is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      const amount = 100_000;

      await usdglo.connect(user1).increaseAllowance(user2.address, amount);
      await usdglo.connect(user1).denylist(user2.address);

      await expect(
        usdglo.connect(user1).decreaseAllowance(user2.address, amount)
      )
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user2.address);
    });
  });

  describe("misc behaviour", function () {
    it("reverts decreaseAllowance if subtractedValue > currentAllowance", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      const amount = 1;

      await expect(
        usdglo.connect(user1).decreaseAllowance(user2.address, amount)
      ).to.be.revertedWith("ERC20: decreased allowance below zero");
    });
  });
});
