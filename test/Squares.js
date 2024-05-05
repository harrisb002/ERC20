const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("Squares", function () {
    let squaresToken;
    let wethToken;
    let sqzOwner, sqzAddr1, sqzAddr2;

    // For tracking weth transactions
    const expTaken = ethers.parseEther("1");
    const expRecieved = ethers.parseEther("1");

    // Total supply
    const TOTAL_SUPPLY = ethers.parseEther("100000000000")

    // 1 Eth = 1,000,000 SQZ
    let price = ethers.parseEther("0.000001");

    beforeEach(async function () {
        const Weth = await hre.ethers.getContractFactory("WETH");
        [wethOwner, wethAddr1, wethAddr2] = await hre.ethers.getSigners();
        wethToken = await Weth.deploy(ethers.parseEther("100000000000"));

        const Token = await hre.ethers.getContractFactory("Squares");
        [sqzOwner, sqzAddr1, sqzAddr2] = await hre.ethers.getSigners();
        squaresToken = await Token.deploy(wethToken, price);
    });

    describe("\n\nERC20 Standard Functions", () => {
        it("Should return the correct name", async function () {
            expect(await squaresToken.name()).to.equal("Squares");
        });

        it("Should return the correct symbol", async function () {
            expect(await squaresToken.symbol()).to.equal("SQZ");
        });

        it("Should return the correct decimals", async function () {
            expect(await squaresToken.decimals()).to.equal(18);
        });

        it("Should return the correct total supply", async function () {
            expect(await squaresToken.totalSupply()).to.equal(TOTAL_SUPPLY);
        });

        it("Should return the correct exchangeRate", async function () {
            expect(await squaresToken.etherExchangeRate(ethers.parseEther("1"))).to.equal(1000000);
        });
    });

    describe("\n\nBuying SQZ With Eth", () => {
        it("Should correctly transfer SQZ tokens using ETH", async function () {
            await expect(
                squaresToken.connect(sqzAddr1).buyTokensUsingEther({ value: ethers.parseEther("1") })
            ).to.changeTokenBalances(
                squaresToken,
                [squaresToken, sqzAddr1],
                [-1000000, 1000000]
            );
        });
    });

    describe("\n\nBuying SQZ With WETH", () => {
        it("Should correctly transfer SQZ to user using WETH", async function () {
            await wethToken.connect(wethOwner).approve(squaresToken, ethers.parseEther("1"));
            await expect(squaresToken.connect(wethOwner).buyTokensUsingWETH(ethers.parseEther("1"))).to.changeTokenBalances(
                squaresToken,
                [squaresToken, wethOwner],
                [-1000000, 1000000]
            );

        });

        it("Should correctly transfer WETH to Squares contract when SQZ bought by WETH", async function () {
            await wethToken.connect(wethOwner).approve(squaresToken, ethers.parseEther("1"));
            await expect(squaresToken.connect(wethOwner).buyTokensUsingWETH(ethers.parseEther("1"))).to.changeTokenBalances(
                wethToken,
                [wethOwner, squaresToken],
                [-expTaken, expRecieved]
            );

        });

        it("User CAN NOT send more WETH than Squares allowance to buy tokens", async () => {
            await wethToken.connect(wethOwner).approve(squaresToken, ethers.parseEther(".75"));
            expect(squaresToken.connect(wethOwner).buyTokensUsingWETH(ethers.parseEther("1"))).to.be.reverted;
        });

    });

    describe("\n\nWithdrawals", () => {
        it("Should NOT allow non-owner to withdraw tokens", async function () {
            await expect(squaresToken.connect(sqzAddr1).withdrawTokens()).to.be.reverted;
        });

        it("Should allow sqzOwner to withdraw tokens", async function () {
            await expect(squaresToken.connect(sqzOwner).withdrawTokens()).to.changeTokenBalances(
                squaresToken,
                [squaresToken, sqzOwner],
                [-TOTAL_SUPPLY, TOTAL_SUPPLY]
            )
        });

        it("Should allow sqzOwner to withdraw Ether", async function () {
            // Make a trans with Eth
            await squaresToken.connect(sqzAddr1).buyTokensUsingEther({ value: ethers.parseEther("1") });

            await squaresToken.connect(sqzOwner).withdrawEth();

            let newbal = await ethers.provider.getBalance(sqzOwner);
            expect(newbal).to.be.gt(0);
        });

        it("Should allow sqzOwner to withdraw WETH", async function () {
            // Make a trans using WETH
            await wethToken.connect(wethOwner).approve(squaresToken, ethers.parseEther("1"));
            await squaresToken.connect(wethOwner).buyTokensUsingWETH(ethers.parseEther("1"));
            await expect(squaresToken.connect(sqzOwner).withdrawWETH()).to.changeTokenBalances(
                wethToken,
                [squaresToken, sqzOwner],
                [-expTaken, expRecieved]
            )
        });
    });

});
