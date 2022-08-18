import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployUSDGLOFixture } from "./fixtures";
import { ethers } from "hardhat";

import { MINTER_ROLE, PAUSER_ROLE, DENYLISTER_ROLE } from "./utils";

describe("transfer functionality of USDGLO", function () {
  describe("paused behaviour", function () {
    it("reverts transfer if USDGLO is paused", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(PAUSER_ROLE, user1.address);

      const amount = 100_000;

      await usdglo.connect(user1).mint(user1.address, amount);
      await usdglo.connect(user1).pause();

      await expect(
        usdglo.connect(user1).transfer(user2.address, amount)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("denylisted behaviour", function () {
    it("reverts transfer if sender is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, admin.address);

      const amount = 100_000;

      await usdglo.connect(user1).mint(user1.address, amount);
      await usdglo.connect(admin).denylist(user1.address);

      await expect(usdglo.connect(user1).transfer(user2.address, amount))
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user1.address);
    });

    it("reverts transfer if receiver is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      const amount = 100_000;

      await usdglo.connect(user1).mint(user1.address, amount);
      await usdglo.connect(user1).denylist(user2.address);

      await expect(usdglo.connect(user1).transfer(user2.address, amount))
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user2.address);
    });
  });

  describe("happypath behaviour", function () {
    it("transfer must work", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, admin.address);

      await usdglo.connect(admin).mint(user1.address, 25_000);
      await usdglo.connect(admin).mint(user2.address, 50_000);

      await expect(usdglo.connect(user1).transfer(user2.address, 10_000))
        .to.emit(usdglo, "Transfer")
        .withArgs(user1.address, user2.address, 10_000);
      expect(await usdglo.balanceOf(user1.address)).to.equal(15_000);
      expect(await usdglo.balanceOf(user2.address)).to.equal(60_000);
    });
  });

  describe("misc behaviour", function () {
    it("reverts transfer if receiver is zero address", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);

      const amount = 100_000;

      await usdglo.connect(admin).grantRole(MINTER_ROLE, admin.address);
      await usdglo.connect(admin).mint(admin.address, amount);

      await expect(
        usdglo.connect(admin).transfer(ethers.constants.AddressZero, amount)
      ).to.be.revertedWith("ERC20: transfer to the zero address");
    });

    it("reverts if amount is greater than balance", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1] = await ethers.getSigners();

      const amount = 100_000;
      const transferAmount = 150_000;

      await usdglo.connect(admin).grantRole(MINTER_ROLE, admin.address);
      await usdglo.connect(admin).mint(admin.address, amount);

      await expect(
        usdglo.connect(admin).transfer(user1.address, transferAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });
});

describe("transferFrom functionality of USDGLO", function () {
  describe("paused behaviour", function () {
    it("reverts transferFrom if USDGLO is paused", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(PAUSER_ROLE, user1.address);

      const amount = 100_000;

      await usdglo.connect(user1).mint(user1.address, amount);
      await usdglo.connect(user1).approve(user2.address, amount);
      await usdglo.connect(user1).pause();

      await expect(
        usdglo.connect(user2).transferFrom(user1.address, user2.address, amount)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("denylisted behaviour", function () {
    it("reverts transferFrom if from is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2, user3] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, admin.address);

      const amount = 100_000;

      await usdglo.connect(user1).mint(user1.address, amount);
      await usdglo.connect(user1).approve(user3.address, amount);
      await usdglo.connect(admin).denylist(user1.address);

      await expect(
        usdglo.connect(user3).transferFrom(user1.address, user2.address, amount)
      )
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user1.address);
    });

    it("reverts transferFrom if receiver is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2, user3] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      const amount = 100_000;

      await usdglo.connect(user1).mint(user1.address, amount);
      await usdglo.connect(user1).approve(user3.address, amount);
      await usdglo.connect(user1).denylist(user2.address);

      await expect(
        usdglo.connect(user3).transferFrom(user1.address, user2.address, amount)
      )
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user2.address);
    });

    it("reverts transferFrom if the caller is denylisted", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2, user3] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      const amount = 100_000;

      await usdglo.connect(user1).mint(user1.address, amount);
      await usdglo.connect(user1).approve(user3.address, amount);
      await usdglo.connect(user1).denylist(user3.address);

      await expect(
        usdglo.connect(user3).transferFrom(user1.address, user2.address, amount)
      )
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user3.address);
    });
  });

  describe("happypath behaviour", function () {
    it("transferFrom must work", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2, user3] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, admin.address);

      await usdglo.connect(admin).mint(user1.address, 25_000);
      await usdglo.connect(admin).mint(user2.address, 50_000);
      await usdglo.connect(admin).mint(user3.address, 75_000);
      await usdglo.connect(user1).approve(user3.address, 10_000);

      await expect(
        usdglo.connect(user3).transferFrom(user1.address, user2.address, 5_000)
      )
        .to.emit(usdglo, "Transfer")
        .withArgs(user1.address, user2.address, 5_000);
      expect(await usdglo.balanceOf(user1.address)).to.equal(20_000);
      expect(await usdglo.balanceOf(user2.address)).to.equal(55_000);
      expect(await usdglo.balanceOf(user3.address)).to.equal(75_000);

      await expect(
        usdglo.connect(user3).transferFrom(user1.address, user3.address, 5_000)
      )
        .to.emit(usdglo, "Transfer")
        .withArgs(user1.address, user3.address, 5_000);
      expect(await usdglo.balanceOf(user1.address)).to.equal(15_000);
      expect(await usdglo.balanceOf(user2.address)).to.equal(55_000);
      expect(await usdglo.balanceOf(user3.address)).to.equal(80_000);
    });
  });

  describe("misc behaviour", function () {
    it("reverts transferFrom if the amount exceeds allowance", async function () {
      const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2, user3] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);

      const mintAmount = 100_000;
      const approvalAmount = 80_000;

      await usdglo.connect(user1).mint(user1.address, mintAmount);
      await usdglo.connect(user1).approve(user3.address, approvalAmount);

      await expect(
        usdglo
          .connect(user3)
          .transferFrom(user1.address, user2.address, mintAmount)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
  });
});
