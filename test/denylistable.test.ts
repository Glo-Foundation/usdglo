import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployUSDGLOFixture } from "./fixtures";
import { ethers } from "hardhat";

import {
  getAccessControlRevertMessage,
  DENYLISTER_ROLE,
  DENYLISTER_ROLE_NAME,
  MINTER_ROLE,
} from "./utils";

describe("denylistable functionality of USDGLO", function () {
  describe("role behaviour", function () {
    it("reverts denylist if called by address without DENYLISTER_ROLE", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      const expectedRevertMessage = getAccessControlRevertMessage(
        DENYLISTER_ROLE_NAME,
        user1.address
      );
      await expect(
        usdglo.connect(user1).denylist(user2.address)
      ).to.be.revertedWith(expectedRevertMessage);
    });

    it("successful denylist if called by address with DENYLISTER_ROLE", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      expect(await usdglo.isDenylisted(user2.address)).to.be.false;
      await usdglo.connect(user1).denylist(user2.address);
      expect(await usdglo.isDenylisted(user2.address)).to.be.true;
    });

    it("reverts undenylist if called by address without DENYLISTER_ROLE", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      const expectedRevertMessage = getAccessControlRevertMessage(
        DENYLISTER_ROLE_NAME,
        user1.address
      );
      await expect(
        usdglo.connect(user1).undenylist(user2.address)
      ).to.be.revertedWith(expectedRevertMessage);
    });

    it("successful undenylist if called by address with DENYLISTER_ROLE", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      await usdglo.connect(user1).denylist(user2.address);
      expect(await usdglo.isDenylisted(user2.address)).to.be.true;
      await usdglo.connect(user1).undenylist(user2.address);
      expect(await usdglo.isDenylisted(user2.address)).to.be.false;
    });

    it("reverts destroyDenylistedFunds if called by address without DENYLISTER_ROLE", async function () {
      const { usdglo } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      const expectedRevertMessage = getAccessControlRevertMessage(
        DENYLISTER_ROLE_NAME,
        user1.address
      );
      await expect(
        usdglo.connect(user1).destroyDenylistedFunds(user2.address)
      ).to.be.revertedWith(expectedRevertMessage);
    });

    it("successful destroyDenylistedFunds if called by address with DENYLISTER_ROLE", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);

      const amount = 100_000;

      await usdglo.connect(user1).mint(user2.address, amount);
      expect(await usdglo.balanceOf(user2.address)).to.equal(amount);

      await usdglo.connect(user1).denylist(user2.address);
      expect(await usdglo.isDenylisted(user2.address)).to.be.true;
      expect(await usdglo.balanceOf(user2.address)).to.equal(amount);

      await usdglo.connect(user1).destroyDenylistedFunds(user2.address);
      expect(await usdglo.balanceOf(user2.address)).to.equal(0);

      await usdglo.connect(user1).undenylist(user2.address);
      expect(await usdglo.balanceOf(user2.address)).to.equal(0);
    });
  });

  describe("event behaviour", function () {
    it("emits Denylist event on successful denylist", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      await expect(usdglo.connect(user1).denylist(user2.address))
        .to.emit(usdglo, "Denylist")
        .withArgs(user1.address, user2.address);
    });

    it("emits Undenylist event on successful undenylisti", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      await usdglo.connect(user1).denylist(user2.address);
      await expect(usdglo.connect(user1).undenylist(user2.address))
        .to.emit(usdglo, "Undenylist")
        .withArgs(user1.address, user2.address);
    });

    it("emits DestroyDenylistedFunds event on successful destroyDenylistedFunds", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);
      await usdglo.connect(admin).grantRole(MINTER_ROLE, user1.address);

      const amount = 100_000;

      await usdglo.connect(user1).mint(user2.address, amount);
      await usdglo.connect(user1).denylist(user2.address);
      await expect(usdglo.connect(user1).destroyDenylistedFunds(user2.address))
        .to.emit(usdglo, "DestroyDenylistedFunds")
        .withArgs(user1.address, user2.address, amount);
    });
  });

  describe("denylisting conditions", function () {
    it("reverts denylist if denylistee is already denylisted", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      await usdglo.connect(user1).denylist(user2.address);

      await expect(usdglo.connect(user1).denylist(user2.address))
        .to.be.revertedWithCustomError(usdglo, "IsDenylisted")
        .withArgs(user2.address);
    });

    it("reverts undenylist if denylistee is not currently denylisted", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      await expect(usdglo.connect(user1).undenylist(user2.address))
        .to.be.revertedWithCustomError(usdglo, "IsNotDenylisted")
        .withArgs(user2.address);
    });

    it("reverts destroyDenylistedFunds if denylistee is not currently denylisted", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user1, user2] = await ethers.getSigners();

      await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, user1.address);

      await expect(usdglo.connect(user1).destroyDenylistedFunds(user2.address))
        .to.be.revertedWithCustomError(usdglo, "IsNotDenylisted")
        .withArgs(user2.address);
    });
  });
});
