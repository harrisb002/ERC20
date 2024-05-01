const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, ZeroAddress } = require("ethers");

describe("DEX", function () {
  // global vars
  // let weth = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Use the contract instance for the Wrapped Ether contract
  let squaresToken;
  let dex;
  let weth;
  let owner;
  let addr1;
  let addr2;

  // Amount of ETH/WETH for a 1 SQZ
  let price = 10; // Just for now to be easy...
  let tokenCap = 10000000; // 10MIl
  let tokenBlockReward = 10;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    const Token = await hre.ethers.getContractFactory("Squares"); // Get Contract instance
    [owner, addr1, addr2] = await hre.ethers.getSigners();
    squaresToken = await Token.deploy(tokenCap, tokenBlockReward);

    const Weth = await hre.ethers.getContractFactory("WETH"); // Get Contract instance
    [wethOwner, wethAddr1, wethAddr2] = await hre.ethers.getSigners();
    weth = await Weth.deploy(100000);

    const DEX = await hre.ethers.getContractFactory("DEX"); // Get Contract instance
    dex = await DEX.deploy(squaresToken.target, weth.target, price); // Connect the sqaures contract
  });

  describe("Sell", () => {
    it("Should fail transferAllowance if contract is not approved (owner)", async () => {
      await expect(dex.transferAllowance()).to.be.reverted;
    });

    it("Should not allow non-owner to call transferAllowance", async () => {
      await expect(dex.connect(addr1).transferAllowance()).to.be.reverted;
    });

    it("Should allow contract to approve tokens for an address", async () => {
      await squaresToken.approve(dex.target, 100); // Approve 100 tokens
    });

    it("Sell should transfer tokens from owner to contract", async () => {
      await squaresToken.approve(dex.target, 100); // Approve 100 tokens

      await expect(dex.transferAllowance()).to.changeTokenBalances(
        squaresToken,
        [owner.address, dex.target],
        [-100, 100]
      );
    });
  });
  describe("SQZ Price and Balance", () => {
    it("Should return correct token balance", async () => {
      await squaresToken.approve(dex.target, 100); // Approve 100 tokens

      await expect(dex.transferAllowance()).to.changeTokenBalances(
        squaresToken,
        [owner.address, dex.target],
        [-100, 100]
      );

      /// Check the DEX token balance
      const dexBalance = await dex.getTokenBalance();

      // Assert that the DEX contract has the expected balance (100)
      expect(dexBalance).to.equal(100);
    });

    it("Should return correct token price based on amount of ETH/WETH", async () => {
      expect(await dex.etherExchangeRate(10)).to.equal(10 / price);
    });
  });

  describe("Buy using Ether", () => {
    it("User can buy tokens using Ether", async () => {
      await squaresToken.approve(dex.target, 200); // Approve 200 tokens

      await expect(dex.transferAllowance()).to.changeTokenBalances(
        squaresToken,
        [owner.address, dex.target],
        [-200, 200]
      );

      await expect(
        dex.connect(addr1).buyTokensUsingEther({ value: 2000 })
      ).to.changeTokenBalances(
        squaresToken,
        [dex.target, addr1.address],
        [-200, 200]
      );
    });

    it("User cannot buy tokens using Ether if user does not have access to them", async () => {
      await squaresToken.approve(dex.target, 90); // Approve 90 tokens

      await expect(dex.transferAllowance()).to.changeTokenBalances(
        squaresToken,
        [owner.address, dex.target],
        [-90, 90]
      );

      await expect(dex.connect(addr1).buyTokensUsingEther({ value: 9000 })).to
        .be.reverted;
    });
  });

  describe("Buy using WETH", () => {
    it("User can buy tokens using Weth", async () => {
      await squaresToken.approve(dex.target, 200); // Approve 200 tokens

      await expect(dex.transferAllowance()).to.changeTokenBalances(
        squaresToken,
        [owner.address, dex.target],
        [-200, 200]
      );

      // Approve 2000 weth of allowance to move on the sender's behalf
      await weth.approve(dex.target, 2000);

      await expect(dex.transferWethAllowance()).to.changeTokenBalances(
        weth,
        [owner.address, dex.target],
        [-2000, 2000]
      );

      await expect(
        dex.connect(addr1).buyTokensUsingWETH(2000)
      ).to.changeTokenBalances(
        squaresToken,
        [dex.target, addr1.address],
        [-200, 200]
      );
    });

    it("User cannot buy tokens using WETH if user does not have access to them", async () => {
      await squaresToken.approve(dex.target, 200); // Approve 200 SQZ

      await expect(dex.transferAllowance()).to.changeTokenBalances(
        squaresToken,
        [owner.address, dex.target],
        [-200, 200]
      );

      //Now try and transfer a WETH allowance without any approval
      await expect(dex.transferWethAllowance()).to.be.reverted;
    });
  });

  describe("Withdraw SQZ", () => {
    it("Non-owner cannot withdraw tokens", async () => {
      await expect(dex.connect(addr1).withdrawTokens()).to.be.reverted;
    });

    it("Owner can withdraw tokens", async () => {
      await squaresToken.approve(dex.target, 50); // Approve 190 tokens

      await expect(dex.transferAllowance()).to.changeTokenBalances(
        squaresToken,
        [owner.address, dex.target],
        [-50, 50]
      );
      await expect(dex.withdrawTokens()).to.changeTokenBalances(
        squaresToken,
        [dex.target, owner.address],
        [-50, 50]
      );
    });
  });
});
