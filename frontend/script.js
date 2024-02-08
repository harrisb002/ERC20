const { ethers } = require("hardhat");

const provider = new ethers.provider.Web3Provider(window.ethereum);
let signer;

const tokenAddress = "0x09635F643e140090A9A8Dcd712eD6285858ceBef";
let tokenContract = null; //Need token to approve transfer
const tokenAbi = [
    "constructor(uint256 initialSupply)",
    "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)",
    "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
    "error ERC20InvalidApprover(address approver)",
    "error ERC20InvalidReceiver(address receiver)",
    "error ERC20InvalidSender(address sender)",
    "error ERC20InvalidSpender(address spender)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function transfer(address to, uint256 value) returns (bool)",
    "function transferFrom(address from, address to, uint256 value) returns (bool)"
];

const dexAddress = "0xc5a5C42992dECbae36851359345FE25997F5C42d";
let dexContract = null; //Need dex to allow for all other functions
const dexAbi = [
    "constructor(address _token, uint256 _price)",
    "function associatedToken() view returns (address)",
    "function buy(uint256 numTokens) payable",
    "function getPrice(uint256 numTokens) view returns (uint256)",
    "function getTokenBalance() view returns (uint256)",
    "function sell()",
    "function withdrawFunds()",
    "function withdrawTokens()"
];

async function getAccess() {
    if (tokenContract) return;
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
    dexContract = new ethers.Contract(dexAddress, dexAbi, signer);
}



