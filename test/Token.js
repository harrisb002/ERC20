const { expect } = require("chai");

describe("Token", () => {
  //Global Variables
  let token;
  let owner;
  let addr1;
  let addr2;

  //Use string because contract requires a big int
  //this is implicitly convertable from a string
  let tokenSupply = "100";

  //Deploy the contract before each set of tests
  //Runs before each of the  describe blocks
  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy(tokenSupply); //Pass the tokens supply for the constructor
  });

  describe("Deployment", () => {
    //Make sure the contract will assign the tokens who dedployed it
    it("Should assign total supply of tokens to the owner/deployer", async () => {
      const ownerBalance = await token.balanceOf(owner.address);
      //Whatever the total supply of the contract is should be equal to the owners balance
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });
  });
});
