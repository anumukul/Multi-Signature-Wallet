const hre=require("hardhat");

async function main(){

    const owners=["0x6AFdcc2ff48cbEdE371F35C2083E62E1fF812b90","0xF00b3321E87d0CFABe761B18A84333537e97E055","0x5E21A167413d22c7f4fBBc6B6080F250Bf900BAF"];

    const required=3;

    const Wallet=await hre.ethers.getContractFactory("MultiSignatureWallet");

    const wallet=await Wallet.deploy(owners,required);
      

    console.log("Deploying contract");

    console.log("Contract deployed at address", await wallet.getAddress());





}


main().catch((error) => {
    console.error(error);
    process.exit(1);
});
