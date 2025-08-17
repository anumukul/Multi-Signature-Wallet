const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSignatureWallet", function () {
  let wallet, owners, addr1, addr2, addr3, addr4, addr5;
  const required = 2;

  beforeEach(async function () {
    [addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
    owners = [addr1.address, addr2.address, addr3.address];
    const Wallet = await ethers.getContractFactory("MultiSignatureWallet", addr1);
    wallet = await Wallet.deploy(owners, required);
  });

  it("should initialize owners and required threshold", async function () {
    const contractOwners = await wallet.getOwners();
    expect(contractOwners).to.include.members(owners);
    expect(await wallet.required()).to.equal(required);
  });

  it("should add and remove guardians", async function () {
    await wallet.addGuardian(addr4.address); // addr1 is default runner
    let guardians = await wallet.getGuardians();
    expect(guardians).to.include(addr4.address);

    await wallet.removeGuardian(addr4.address);
    guardians = await wallet.getGuardians();
    expect(guardians).to.not.include(addr4.address);
  });
});