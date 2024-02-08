const { ethers } = require("hardhat");

const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;

const tokenAbi = [];
const tokenAddress = "";
let tokenContract = null; //Need token to approve transfer


const dexAbi = [];
const dexAddress = "";
let dexContract = null; //Need dex to allow for all other functions

async function getAccess() {
    if (tokenContract) return;
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
    dexContract = new ethers.Contract(dexAddress, dexAbi, signer);
}



