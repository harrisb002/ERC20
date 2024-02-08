const { expect } = require("chai");

describe("DEX", () => {
  let tokenSupply = "100";

  let token;
  let dex;

  let price = 100;

  let owner;
  let addr1;
  let addr2;

  before(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy(tokenSupply);

    const DEX = await ethers.getContractFactory("DEX");
    dex = await DEX.deploy(token.target, price);
  });

  describe("Sell", () => {
    it("Should fail if contract is not approved", async () => {
      await expect(dex.sell()).to.be.reverted;
    });

    it("Should allow DEX to transfer tokens", async () => {
      await token.approve(dex.target, 100);
    });

    it("Should not allow non-owner to call sell()", async () => {
      await expect(dex.connect(addr1).sell()).to.be.reverted;
    });

    it("Sell should transfer tokens from owner to contract", async () => {
      await expect(dex.sell()).to.changeTokenBalances(
        token,
        [owner.address, dex.target],
        [-100, 100]
      );
    });

    describe("Getters", () => {
      it("Should return correct token balance", async () => {
        expect(await dex.getTokenBalance()).to.equal(100);
      });
  
      it("Should return correct token price", async () => {
        expect(await dex.getPrice(10)).to.equal(price * 10);
      });
    });

    describe("Buy", () => {
      it("User can buy tokens", async () => {
        await expect(
          dex.connect(addr1).buy(10, { value: 1000 })
        ).to.changeTokenBalances(token, [dex.target, addr1.address], [-10, 10]);
      });
  
      it("User cannot buy invalid number of tokens", async () => {
        await expect(dex.connect(addr1).buy(91, { value: 9100 })).to.be.reverted;
      });
  
      it("User cannot buy with invalid value", async () => {
        await expect(dex.connect(addr1).buy(5, { value: 510 })).to.be.reverted;
      });
    });
  
    describe("Withdraw tokens", () => {
      it("Non-owner cannot withdraw tokens", async () => {
        await expect(dex.connect(addr1).withdrawTokens()).to.be.reverted;
      });
  
      it("Owner can withdraw tokens", async () => {
        await expect(dex.withdrawTokens()).to.changeTokenBalances(
          token,
          [dex.target, owner.address],
          [-90, 90]
        );
      });
    });
  });
});