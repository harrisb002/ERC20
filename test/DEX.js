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
  });
});