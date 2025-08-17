require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */

require("dotenv").config();

module.exports = {
  solidity: {
     version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: true 
    },

    sepolia:{

      url:process.env.RPC_URL,
      accounts:[process.env.PRIVATE_KEY]
    }
  }
};