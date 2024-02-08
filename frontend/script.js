const provider = new ethers.providers.Web3Provider(window.ethereum);
let signer;

const tokenAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
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
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
];

const dexAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
let dexContract = null; //Need dex to allow for all other functions
const dexAbi = [
  "constructor(address _token, uint256 _price)",
  "function associatedToken() view returns (address)",
  "function buy(uint256 numTokens) payable",
  "function getPrice(uint256 numTokens) view returns (uint256)",
  "function getTokenBalance() view returns (uint256)",
  "function sell()",
  "function withdrawFunds()",
  "function withdrawTokens()",
];

async function getAccess() {
  if (tokenContract) return;
  await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
  dexContract = new ethers.Contract(dexAddress, dexAbi, signer);
}

async function getPrice() {
  await getAccess();
  const price = await dexContract.getPrice(1); //Get price of one token
  document.getElementById("tokenPrice").innerHTML = price; //Get from HTML class name
  console.log(price);
  return price;
}

async function getTokenBalance() {
  await getAccess();
  const balance = await tokenContract.balanceOf(await signer.getAddress());
  document.getElementById("tokensBalance").innerHTML = balance;
}

async function grantAccess() {
  await getAccess();
  const value = document.getElementById("tokenGrant").value;
  await tokenContract
    .approve(dexAddress, value)
    .then(() => alert("success"))
    .catch((error) => alert(error));
}

async function sell() {
  await getAccess();
  await dexContract
    .sell()
    .then(() => alert("Success"))
    .catch((error) => alert(error));
}

async function buy() {
  await getAccess();
  const tokenAmount = document.getElementById("tokensAvailable").value;
  const value = (await getPrice()) * tokenAmount;
  await dexContract
    .buy(tokenAmount, { value: value })
    .then(() => alert("Success"))
    .catch((error) => alert(error));
}

async function getAvailableTokens() {
  await getAccess();
  const tokens = await dexContract.getTokenBalance();
  document.getElementById("tokensAvailable").innerHTML = tokens;
}
