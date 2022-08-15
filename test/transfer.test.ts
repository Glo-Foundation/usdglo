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
});
