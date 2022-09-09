import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployUSDGLOFixture } from "./fixtures";
import { ethers } from "hardhat";

import { DEFAULT_ADMIN_ROLE } from "./utils";

describe("role functionality of USDGLO", function () {
  describe("admin role", function () {
    it("successful admin role transfer and renouncement by previous admin", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be
        .true;
      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, user.address)).to.be
        .false;

      await usdglo.connect(admin).grantRole(DEFAULT_ADMIN_ROLE, user.address);
      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be
        .true;
      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, user.address)).to.be.true;

      await usdglo
        .connect(admin)
        .renounceRole(DEFAULT_ADMIN_ROLE, admin.address);
      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be
        .false;
      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, user.address)).to.be.true;
    });

    it("successful admin role transfer and revoke previous admin", async function () {
      const { usdglo, admin } = await loadFixture(deployUSDGLOFixture);
      const [_, user] = await ethers.getSigners();

      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be
        .true;
      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, user.address)).to.be
        .false;

      await usdglo.connect(admin).grantRole(DEFAULT_ADMIN_ROLE, user.address);
      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be
        .true;
      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, user.address)).to.be.true;

      await usdglo.connect(user).revokeRole(DEFAULT_ADMIN_ROLE, admin.address);
      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).to.be
        .false;
      expect(await usdglo.hasRole(DEFAULT_ADMIN_ROLE, user.address)).to.be.true;
    });
  });
});
