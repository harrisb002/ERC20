// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require("fs/promises");

async function main() {
  const WETH_CONTRACT = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";

  const SquareToken = await hre.ethers.getContractFactory("Squares");
  const square = await SquareToken.deploy(WETH_CONTRACT, ethers.parseEther("0.001"));

  await square.waitForDeployment();
  await writeDeploymentInfo(square, "squares.json"); //Write to JSON file
}

async function writeDeploymentInfo(contract, filename = "") {
  const data = {
    network: hre.network.name,
    contract: {
      address: contract.target,
      signerAddress: contract.runner.address,
      abi: contract.interface.format(),
    },
  };

  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filename, content, { encoding: "utf-8" });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});