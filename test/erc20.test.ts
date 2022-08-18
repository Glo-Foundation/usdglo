import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { deployUSDGLOFixture } from "./fixtures";
import { ethers } from "hardhat";

import { DENYLISTER_ROLE, MINTER_ROLE } from "./utils";

describe("generic ERC20 methods", function () {
  it("name must work", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    expect(await usdglo.name()).to.equal("USD Global Income Coin");
  });

  it("symbol must work", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    expect(await usdglo.symbol()).to.equal("USDGLO");
  });

  it("decimals must work", async function () {
    const { usdglo } = await loadFixture(deployUSDGLOFixture);
    expect(await usdglo.decimals()).to.equal(18);
  });

  it("totalSupply must work", async function () {
    const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
    const [_, user1, user2] = await ethers.getSigners();

    await usdglo.connect(admin).grantRole(MINTER_ROLE, admin.address);

    expect(await usdglo.totalSupply()).to.equal(0);
    await usdglo.connect(admin).mint(user1.address, 100_000);
    expect(await usdglo.totalSupply()).to.equal(100_000);
    await usdglo
      .connect(admin)
      .mint(user2.address, (1n << 255n) - 1n - 100_000n);
    expect(await usdglo.totalSupply()).to.equal((1n << 255n) - 1n);
  });

  it("balanceOf must work", async function () {
    const { admin, usdglo } = await loadFixture(deployUSDGLOFixture);
    const [_, user1, user2] = await ethers.getSigners();

    await usdglo.connect(admin).grantRole(MINTER_ROLE, admin.address);
    await usdglo.connect(admin).grantRole(DENYLISTER_ROLE, admin.address);

    await usdglo.connect(admin).mint(user1.address, 100_000);
    expect(await usdglo.balanceOf(user1.address)).to.equal(100_000);

    await usdglo
      .connect(admin)
      .mint(user2.address, (1n << 255n) - 1n - 100_000n);
    expect(await usdglo.balanceOf(user2.address)).to.equal(
      (1n << 255n) - 1n - 100_000n
    );
    await usdglo.connect(admin).denylist(user2.address);
    expect(await usdglo.balanceOf(user2.address)).to.equal(
      (1n << 255n) - 1n - 100_000n
    );
  });
});
