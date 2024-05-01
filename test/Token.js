// const { expect } = require("chai");
// const hre = require("hardhat");
// const { ethers, ZeroAddress } = require("ethers");

// describe("Squares contract", function () {
//   // global vars
//   let Token;
//   let squaresToken;
//   let owner;
//   let addr1;
//   let addr2;

//   //Use string because contract requires a big int
//   //this is implicitly convertable from a string
//   let tokenCap = 10000000; // 10MIl
//   let tokenBlockReward = 10;

//   beforeEach(async function () {
//     // Get the ContractFactory and Signers here.
//     Token = await hre.ethers.getContractFactory("Squares");
//     [owner, addr1, addr2] = await hre.ethers.getSigners();
//     squaresToken = await Token.deploy(tokenCap, tokenBlockReward);
//   });
//   describe("Deployment", function () {
//     it("Should set the right owner", async function () {
//       expect(await squaresToken.owner()).to.equal(owner.address);
//     });

//     it("Should assign the total supply of tokens to the owner", async function () {
//       const ownerBalance = await squaresToken.balanceOf(owner.address);
//       expect(await squaresToken.totalSupply()).to.equal(ownerBalance);
//     });
//   });

//   describe("Transactions", function () {
//     it("Should transfer tokens between accounts", async function () {
//       // Transfer 100 tokens from owner to addr1
//       await squaresToken.transfer(addr1.address, 100);
//       const addr1Balance = await squaresToken.balanceOf(addr1.address);
//       expect(addr1Balance).to.equal(100);

//       // Transfer 100 tokens from addr1 to addr2
//       // Use .connect(signer) to send a transaction from another account
//       await squaresToken.connect(addr1).transfer(addr2.address, 100);
//       const addr2Balance = await squaresToken.balanceOf(addr2.address);
//       expect(addr2Balance).to.equal(100);
//     });

//     it("Should fail if sender doesn't have enough tokens", async function () {
//       await squaresToken.balanceOf(owner.address);
//       // Try to send 1 token from addr1 (0 tokens) to owner (1000000 tokens).
//       // `require` will evaluate false and revert the transaction.
//       await expect(
//         squaresToken.connect(addr1).transfer(owner.address, 1)
//       ).to.be.revertedWithCustomError(squaresToken, "ERC20InsufficientBalance"); // Defined in (@openzeppelin/contracts/interfaces/draft-IERC6093.sol)
//     });
//     it("Should update balances after transfers", async function () {
//       await squaresToken.balanceOf(owner.address);

//       // Transfer 100 tokens from owner to addr1.
//       await squaresToken.transfer(addr1.address, 100);

//       // Check owner balance.
//       const ownerBalance = await squaresToken.balanceOf(owner.address);
//       const expOwnerBalance = ownerBalance - BigInt(100);
//       expect(expOwnerBalance).to.equal(expOwnerBalance);

//       ownerBalance = await squaresToken.balanceOf(owner.address);

//       // Transfer another 50 tokens from owner to addr2.
//       await squaresToken.transfer(addr2.address, 50);
      
//       // Check owner balance.
//       expOwnerBalance = ownerBalance - BigInt(100);
//       expect(expOwnerBalance).to.equal(expOwnerBalance);

//       // Check balances again for second transfer.
//       const nextOwnerBalance = await squaresToken.balanceOf(owner.address);
//       const nextExpOwnerBalance = nextOwnerBalance - BigInt(100);
//       expect(nextExpOwnerBalance).to.equal(nextExpOwnerBalance);

//       // Make sure other addrs have recieved the tokens
//       const addr1Balance = await squaresToken.balanceOf(addr1.address);
//       expect(addr1Balance).to.equal(100);

//       const addr2Balance = await squaresToken.balanceOf(addr2.address);
//       expect(addr2Balance).to.equal(50);
//     });
//     it("Should fail if reciever does not have valid address", async function () {
//       const initialAddressBalance = await squaresToken.balanceOf(addr1.address);
//       // try to send to burn address (Other way around is never possible)
//       await expect(
//         squaresToken.connect(addr1).transfer(ZeroAddress, 1)
//       ).to.be.revertedWithCustomError(squaresToken, "ERC20InvalidReceiver");
//     });
//   });
//   describe("Capped Supply", function () {
//     it("Should set the max capped supply to the argument provided during deployment", async function () {
//       const cap = await squaresToken.cap();
//       expect(Math.trunc(hre.ethers.formatEther(cap))).to.equal(tokenCap);
//     });
//   });
//   describe("Block Reward", function () {
//     it("Should set the blockReward to the argument provided during deployment", async function () {
//       const blockReward = await squaresToken.blockReward();
//       expect(Math.trunc(hre.ethers.formatEther(blockReward))).to.equal(
//         tokenBlockReward
//       );
//     });
//   });
// });
