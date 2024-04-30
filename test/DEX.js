const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, ZeroAddress } = require("ethers");

describe("DEX", function () {
  // global vars
  let squaresToken;
  let dex;
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

    const DEX = await hre.ethers.getContractFactory("DEX"); // Get Contract instance
    dex = await DEX.deploy(squaresToken.target, price); // Connect the sqaures contract
  });

  describe("Sell", () => {
    it("Should fail if contract is not approved", async () => {
      await expect(dex.transferAllowance()).to.be.reverted;
    });

    it("Should allow DEX to transfer tokens", async () => {
      await squaresToken.approve(dex.target, 100);
    });

    it("Should not allow non-owner to call sell()", async () => {
      await expect(dex.connect(addr1).transferAllowance()).to.be.reverted;
    });

    it("Sell should transfer tokens from owner to contract", async () => {
      await squaresToken.approve(dex.target, 100); // Approve 100 tokens

      await expect(dex.transferAllowance()).to.changeTokenBalances(
        squaresToken,
        [owner.address, dex.target],
        [-100, 100]
      );
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

      describe("Buy using Ether", () => {
        it("User can buy tokens", async () => {
          await squaresToken.approve(dex.target, 200); // Approve 190 tokens

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

        it("User cannot buy invalid number of tokens, i.e. does not have access to them", async () => {
          await squaresToken.approve(dex.target, 90); // Approve 190 tokens

          await expect(dex.transferAllowance()).to.changeTokenBalances(
            squaresToken,
            [owner.address, dex.target],
            [-90, 90]
          );

          await expect(dex.connect(addr1).buyTokensUsingEther({ value: 9000 }))
            .to.be.reverted;
        });
      });

      describe("Buy using WETH", () => {
        it("User can buy tokens", async () => {
          await squaresToken.approve(dex.target, 200); // Approve 190 tokens

          await expect(dex.transferAllowance()).to.changeTokenBalances(
            squaresToken,
            [owner.address, dex.target],
            [-200, 200]
          );

          await expect(
            dex.connect(addr1).buyTokensUsingWETH(2000)
          ).to.changeTokenBalances(
            squaresToken,
            [dex.target, addr1.address],
            [-200, 200]
          );
        });

        it("User cannot buy invalid number of tokens, i.e. does not have access to them", async () => {
          await squaresToken.approve(dex.target, 90); // Approve 190 tokens

          await expect(dex.transferAllowance()).to.changeTokenBalances(
            squaresToken,
            [owner.address, dex.target],
            [-90, 90]
          );

          await expect(dex.connect(addr1).buyTokensUsingWETH(9000))
            .to.be.reverted;
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
  });
});
