const { expect } = require("chai");
const hre = require("hardhat");
const { ethers, ZeroAddress } = require("ethers");

describe("DEX", function () {
  // global vars
  // let weth = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Use the contract instance for the Wrapped Ether contract
  let squaresToken;
  let dex;

  // For tracking weth transactions
  const expWethTaken = ethers.parseEther("1");
  const expWethRecieved = ethers.parseEther("1");

  // 1 Eth = 1,000 SQZ
  let price = 1000000000000000; // price in wei ~ 0.001 eth
  let tokenCap = 10000000; // 10MIl
  let tokenBlockReward = 10;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    const Token = await hre.ethers.getContractFactory("Squares"); // Get Contract instance
    [sqzOwner, sqzAddr1, sqzAddr2] = await hre.ethers.getSigners();
    squaresToken = await Token.deploy(tokenCap, tokenBlockReward);

    const Weth = await hre.ethers.getContractFactory("WETH"); // Get Contract instance
    [wethOwner, wethAddr1, wethAddr2] = await hre.ethers.getSigners();
    wethToken = await Weth.deploy(ethers.parseEther("10000000"));

    const DEX = await hre.ethers.getContractFactory("DEX"); // Get Contract instance
    [dexOwner, dexAddr1, dexAddr2] = await hre.ethers.getSigners();
    dex = await DEX.deploy(squaresToken.target, wethToken.target, price); // Connect the sqaures contract
  });

  describe("SQZ Allowance", () => {
    it("Should FAIL transferSQZAllowance if contract is not approved (owner)", async () => {
      await expect(dex.transferSQZAllowance()).to.be.reverted;
    });

    it("Should NOT allow non-owner to call transferSQZAllowance", async () => {
      await expect(dex.connect(sqzAddr1).transferSQZAllowance()).to.be.reverted;
    });

    it("Should allow contract to approve SQZ for an address", async () => {
      await squaresToken.approve(dex.target, 100);
    });

    it("transferSQZAllowance should transfer SQZ from owner to contract", async () => {
      await squaresToken.approve(dex.target, 100);

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-100, 100]
      );
    });
  });

  describe("WETH Allowance", () => {
    it("Should FAIL transferWethAllowance if contract is not approved (owner)", async () => {
      await expect(dex.transferWethAllowance()).to.be.reverted;
    });

    it("Should NOT allow non-owner to call transferWethAllowance", async () => {
      await expect(dex.connect(wethAddr1).transferWethAllowance()).to.be
        .reverted;
    });

    it("Should allow contract to approve Weth for an address", async () => {
      await wethToken.approve(dex.target, 100);
    });

    it("transferWethAllowance should transfer Weth from msg.sender to contract", async () => {
      await wethToken.approve(dex.target, ethers.parseEther("1"));
      await expect(dex.transferWethAllowance()).to.changeTokenBalances(
        wethToken,
        [wethOwner.address, dex.target],
        [-expWethTaken, expWethRecieved] // Set as constants above as -1 & 1 Eth
      );
    });
  });

  describe("SQZ Price and Balance", () => {
    it("Should return correct token balance", async () => {
      await squaresToken.approve(dex.target, 100);

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-100, 100]
      );

      /// Check the DEX token balance
      const dexBalance = await dex.getSqzTokenBalance();

      // Assert that the DEX contract has the expected balance (100)
      expect(dexBalance).to.equal(100);
    });

    it("Should return correct token price based on amount of ETH/WETH", async () => {
      expect(await dex.etherExchangeRate(ethers.parseEther("1"))).to.equal(
        1000
      ); // Can buy 1,000 tokens with 1 eth
    });
  });

  describe("Buy using Ether", () => {
    it("User can buy tokens using Ether", async () => {
      await squaresToken.approve(dex.target, 1000);

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-1000, 1000]
      );

      await expect(
        dex
          .connect(sqzAddr1)
          .buyTokensUsingEther({ value: ethers.parseEther("1") })
      ).to.changeTokenBalances(
        squaresToken,
        [dex.target, sqzAddr1.address],
        [-1000, 1000]
      );
    });

    it("User can buy SQZ without spending total SQZ allowance for DEX using Eth", async () => {
      await squaresToken.approve(dex.target, 1200); // Approve 1200 tokens

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-1200, 1200]
      );

      await expect(
        dex
          .connect(sqzAddr1)
          .buyTokensUsingEther({ value: ethers.parseEther("1") })
      ).to.changeTokenBalances(
        squaresToken,
        [dex.target, sqzAddr1.address],
        [-1000, 1000]
      );
    });

    it("User CAN NOT send more Eth than necessary to buy tokens", async () => {
      await squaresToken.approve(dex.target, 800); // Approve 800 tokens

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-800, 800]
      );

      await expect(
        // Pass more Eth than necessary to buy 800 tokens
        dex
          .connect(sqzAddr2)
          .buyTokensUsingEther({ value: ethers.parseEther("1") })
      ).to.be.reverted;
    });

    it("User CAN NOT buy tokens using Ether if user does not have access to them", async () => {
      await squaresToken.approve(dex.target, 190); // Approve 190 tokens

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-190, 190]
      );

      await expect(
        dex
          .connect(sqzAddr1)
          .buyTokensUsingEther({ value: ethers.parseEther("1") })
      ).to.be.reverted;
    });
  });

  describe("Buy using WETH", () => {
    it("User can buy tokens using Weth", async () => {
      await squaresToken.approve(dex.target, 1000); // Approve 1000 tokens

      // Transfer allowance and expect the SQZ contract to deficit the amount sent to DEX contract
      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-1000, 1000]
      );

      await wethToken.approve(dex.target, ethers.parseEther("1"));
      await expect(dex.transferWethAllowance()).to.changeTokenBalances(
        wethToken,
        [wethOwner.address, dex.target],
        [-expWethTaken, expWethRecieved] // Using predefined constants for -1 & 1 WETH
      );

      await expect(
        dex.connect(wethAddr1).buyTokensUsingWETH(ethers.parseEther("1"))
      ).to.changeTokenBalances(
        squaresToken,
        [dex.target, wethAddr1.address],
        [-1000, 1000]
      );
    });

    it("User CAN NOT buy tokens using WETH if DEX does not have allowance to them", async () => {
      await squaresToken.approve(dex.target, 1000); // Approve 1000 tokens

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-1000, 1000]
      );

      await expect(
        dex.connect(wethAddr2).buyTokensUsingWETH(ethers.parseEther("1"))
      ).to.be.reverted;
    });

    it("User can buy SQZ without spending total SQZ allowance for DEX using WETH", async () => {
      await squaresToken.approve(dex.target, 1200); // Approve 1200 tokens

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-1200, 1200]
      );
      await wethToken.approve(dex.target, ethers.parseEther("1"));
      await expect(dex.transferWethAllowance()).to.changeTokenBalances(
        wethToken,
        [wethOwner.address, dex.target],
        [-expWethTaken, expWethRecieved]
      );

      // Now send 1 WETH which DEX has allowance, and expect corresponding diffs
      await expect(
        dex.connect(wethAddr2).buyTokensUsingWETH(ethers.parseEther("1"))
      ).to.changeTokenBalances(
        squaresToken,
        [dex.target, wethAddr2.address],
        [-1000, 1000]
      );
    });

    it("User can buy SQZ without spending total WETH allowance for DEX using WETH", async () => {
      await squaresToken.approve(dex.target, 1000);

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-1000, 1000]
      );
      let doubleExpTaken = expWethTaken * BigInt(2);
      let doubleExpRecieved = expWethRecieved * BigInt(2);

      await wethToken.approve(dex.target, ethers.parseEther("2"));
      await expect(dex.transferWethAllowance()).to.changeTokenBalances(
        wethToken,
        [wethOwner.address, dex.target],
        [-doubleExpTaken, doubleExpRecieved]
      );

      // Now send 1 WETH which DEX has allowance for on top of another 1, and expect corresponding diffs
      await expect(
        dex.connect(wethAddr2).buyTokensUsingWETH(ethers.parseEther("1"))
      ).to.changeTokenBalances(
        squaresToken,
        [dex.target, wethAddr2.address],
        [-1000, 1000]
      );
    });

    it("User CAN NOT send more WETH than necessary to buy tokens", async () => {
      await squaresToken.approve(dex.target, 800); // Approve 800 tokens

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-800, 800]
      );

      await wethToken.approve(dex.target, ethers.parseEther("1"));
      await expect(dex.transferWethAllowance()).to.changeTokenBalances(
        wethToken,
        [wethOwner.address, dex.target],
        [-expWethTaken, expWethRecieved]
      );

      await expect(
        // Pass more WETH than necessary to buy 800 tokens
        dex.connect(wethAddr2).buyTokensUsingWETH(ethers.parseEther("1"))
      ).to.be.reverted;
    });
  });

  // Most functions have onlyOwner modifier.
  describe("Withdraw SQZ", () => {
    it("Non-owner of DEX contract CAN NOT withdraw tokens", async () => {
      await squaresToken.approve(dex.target, 50);

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-50, 50]
      );
      //Should not allow non-woner to withdraw
      await expect(dex.connect(sqzAddr1).withdrawTokens()).to.be.reverted;
    });

    it("Owner of DEX contract can withdraw tokens", async () => {
      await squaresToken.approve(dex.target, 50);

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-50, 50]
      );
      await expect(dex.withdrawTokens()).to.changeTokenBalances(
        squaresToken,
        [dex.target, sqzOwner.address],
        [-50, 50]
      );
    });
  });

  describe("Withdraw Eth", () => {
    it("Non-owner CAN NOT withdraw Eth", async () => {
      await expect(dex.connect(sqzAddr1).withdrawEth()).to.be.reverted;
    });

    it("Owner CAN NOT withdraw Eth if DEX contract doesnt have any", async () => {
      await squaresToken.approve(dex.target, 1000); // Approve 1000 tokens

      // Transfer allowance and expect the SQZ contract to deficit the amount sent to DEX contract
      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-1000, 1000]
      );

      await expect(dex.withdrawEth()).to.be.reverted;
    });

    it("Owner can withdraw Eth from contract", async () => {
      // First give the contract a balance of Eth by purchasing token
      await squaresToken.approve(dex.target, 3000);

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-3000, 3000]
      );

      let times3ExpWethTaken = expWethTaken * BigInt(3);
      let times3ExpWethRecieved = expWethRecieved * BigInt(3);

      await expect(
        dex
          .connect(sqzAddr1)
          .buyTokensUsingEther({ value: ethers.parseEther("3") })
      ).to.changeTokenBalances(
        squaresToken,
        [dex.target, sqzAddr1.address],
        [-3000, 3000]
      );

      //Using Change Ether balances function
      await expect(dex.withdrawEth()).to.changeEtherBalances(
        [dex.target, dexOwner.address],
        [-times3ExpWethTaken, times3ExpWethRecieved]
      );
    });

    it("Owner CAN NOT withdraw the same Eth from contract twice", async () => {
      // First give the contract a balance of Eth by purchasing token
      await squaresToken.approve(dex.target, 3000);

      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-3000, 3000]
      );

      let times3ExpWethTaken = expWethTaken * BigInt(3);
      let times3ExpWethRecieved = expWethRecieved * BigInt(3);

      await expect(
        dex
          .connect(sqzAddr1)
          .buyTokensUsingEther({ value: ethers.parseEther("3") })
      ).to.changeTokenBalances(
        squaresToken,
        [dex.target, sqzAddr1.address],
        [-3000, 3000]
      );

      await expect(dex.withdrawEth()).to.changeEtherBalances(
        [dex.target, dexOwner.address],
        [-times3ExpWethTaken, times3ExpWethRecieved]
      );
      // Cannot withdraw same funds twice
      await expect(dex.withdrawEth()).to.be.reverted;
    });
  });

  describe("Withdraw Weth", () => {
    it("Non-owner CAN NOT withdraw Weth", async () => {
      await expect(dex.connect(sqzAddr1).withdrawWeth()).to.be.reverted;
    });

    it("Owner CAN NOT withdraw Weth if DEX contract doesnt have any", async () => {
      await squaresToken.approve(dex.target, 1000);

      // Transfer allowance and expect the SQZ contract to deficit the amount sent to DEX contract
      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-1000, 1000]
      );

      await expect(dex.withdrawWeth()).to.be.reverted;
    });

    it("Owner can withdraw Weth", async () => {
      // First give the contract a balance of Weth by purchasing token
      await squaresToken.approve(dex.target, 3000);

      // Transfer allowance and expect the SQZ contract to deficit the amount sent to DEX contract
      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-3000, 3000]
      );

      times3ExpWethTaken = expWethTaken * BigInt(3);
      times3ExpWethRecieved = expWethRecieved * BigInt(3);

      await wethToken.approve(dex.target, ethers.parseEther("3"));
      await expect(dex.transferWethAllowance()).to.changeTokenBalances(
        wethToken,
        [wethOwner.address, dex.target],
        [-times3ExpWethTaken, times3ExpWethRecieved]
      );

      await expect(
        dex.connect(wethAddr1).buyTokensUsingWETH(ethers.parseEther("3"))
      ).to.changeTokenBalances(
        squaresToken,
        [dex.target, wethAddr1.address],
        [-3000, 3000]
      );

      await expect(dex.withdrawWeth()).to.changeTokenBalances(
        wethToken,
        [dex.target, dexOwner.address],
        [-times3ExpWethTaken, times3ExpWethRecieved]
      );
    });

    it("Owner can't withdraw same Weth twice", async () => {
      // First give the contract a balance of Weth by purchasing token
      await squaresToken.approve(dex.target, 3000);

      // Transfer allowance and expect the SQZ contract to deficit the amount sent to DEX contract
      await expect(dex.transferSQZAllowance()).to.changeTokenBalances(
        squaresToken,
        [sqzOwner.address, dex.target],
        [-3000, 3000]
      );

      times3ExpWethTaken = expWethTaken * BigInt(3);
      times3ExpWethRecieved = expWethRecieved * BigInt(3);

      await wethToken.approve(dex.target, ethers.parseEther("3"));
      await expect(dex.transferWethAllowance()).to.changeTokenBalances(
        wethToken,
        [wethOwner.address, dex.target],
        [-times3ExpWethTaken, times3ExpWethRecieved]
      );

      await expect(
        dex.connect(wethAddr1).buyTokensUsingWETH(ethers.parseEther("3"))
      ).to.changeTokenBalances(
        squaresToken,
        [dex.target, wethAddr1.address],
        [-3000, 3000]
      );

      await expect(dex.withdrawWeth()).to.changeTokenBalances(
        wethToken,
        [dex.target, dexOwner.address],
        [-times3ExpWethTaken, times3ExpWethRecieved]
      );

      //Try again to withdraw the weth, Should not allow such
      await expect(dex.withdrawWeth()).to.be.reverted;
    });
  });
});
