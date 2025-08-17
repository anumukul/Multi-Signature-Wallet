const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSignatureWallet", function () {
  let wallet, owners, addr1, addr2, addr3, addr4, addr5;
  const  required = 2;

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

  it("should allow owner to submit transaction", async function () {
  const to = addr4.address;
  const value = ethers.parseEther("1");
  const data = "0x";
  await expect(wallet.connect(addr1).submitTransaction(to, value, data))
    .to.emit(wallet, "Submission");
});

it("should allow confirmation and execution of transaction", async function () {
  const to = addr4.address;
  const value = ethers.parseEther("1");
  const data = "0x";

  await addr1.sendTransaction({
    to: wallet.target,
    value: ethers.parseEther("2")
  });
  await wallet.connect(addr1).submitTransaction(to, value, data);
  await wallet.connect(addr2).confirmTransaction(0);

  await ethers.provider.send("evm_increaseTime", [11]); 
await ethers.provider.send("evm_mine", []); 

  await wallet.setDailyLimit(ethers.parseEther("10"));
  await wallet.setWeeklyLimit(ethers.parseEther("100"));

  await expect(wallet.connect(addr1).executeTransaction(0))
    .to.emit(wallet, "Execution");
});

it("should confirm and execute batch transactions", async function () {
  await wallet.connect(addr1).submitTransaction(addr4.address, 0, "0x");
  await wallet.connect(addr1).submitTransaction(addr5.address, 0, "0x");



  await addr1.sendTransaction({
    to: wallet.target,
    value: ethers.parseEther("200")
  });

  await wallet.connect(addr2).batchConfirmation([0, 1]);

   await ethers.provider.send("evm_increaseTime", [11]); 
await ethers.provider.send("evm_mine", []); 

  await wallet.connect(addr3).batchConfirmation([0,1]);


   

  await wallet.setDailyLimit(ethers.parseEther("10"));
  await wallet.setWeeklyLimit(ethers.parseEther("100"));

  console.log(await wallet.transactions(0));
console.log(await wallet.transactions(1));

  await wallet.connect(addr1).batchExecution([0, 1]);

  console.log(await wallet.transactions(0));
console.log(await wallet.transactions(1));
  const tx0 = await wallet.transactions(0);
const tx1 = await wallet.transactions(1);
expect(tx0[3]).to.equal(true); 
expect(tx1[3]).to.equal(true); 
});
});

