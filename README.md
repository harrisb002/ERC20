# ERC20 
Explores deploying an ERC 20 Token contract as well as one to allow for its exchange for native Ethereum 

Utilizes Open Zeppelin for ERC20 protocol
Reference Docs: https://docs.openzeppelin.com/contracts/5.x/erc20

Contracts:
- Token.sol: Contract to represent the ERC20 Token
- DEX.sol: Contract to act as a decentralized exchange to trade in tokens for Ethereum

## Using the Frontend
1. Install the [Liveserver Extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VSCode.
2. Open [base.html](frontend/base.html)
3. Click the button that says "Go Live" in the bottom right hand corner of your VSCode.
4. Import any accounts you need into MetaMask/Frame and change your MetaMask network to "Hardhat".
5. Interact with the contract!

### Shell Commands

#### Starter Commands
1. Install [Node.js](https://nodejs.org/en/download/)
2. `cd ERC20-DEX`
3. `npm install`
4. To test the contract run `npx hardhat test`
5. To deploy the contract to your `localhost` network do the following:
   - `npx hardhat node`
   - `npx hardhat run --network localhost ./script/deploy.js`

#### Other Useful Commands
```
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

## Notes for Open Zeppelin

### IERC20
Main public functions available. Only the person who has minted tokens
Able to transfer tokens or grant access for others to do so as well.

Functions: 
- totalSupply()
- balanceOf(account)
- transfer(to, amount) => Transfer a recipient a certain amount of tokens
- allowance(owner, spender)
- approve(spender, amount) => Approve a contract to be able to transfer tokens on your behalf 
- transferFrom(from, to, amount)

### ERC20
Functions: (see docs for extensive list)
- constructor(name_, symbol_)
- name()
- symbol()
- decimals()
- totalSupply()
- balanceOf(account)
- transfer(to, amount)
- allowance(owner, spender)
- approve(spender, amount)
- transferFrom(from, to, amount)
- increaseAllowance(spender, addedValue)
- decreaseAllowance(spender, subtractedValue)

Base contract to inherit from. Able to use these functions from the base contract but some cannot
be accessed from the interface. The interface describes the core functions seen above however, functions such as,
- increaseAllowance(spender, addedValue)
- decreaseAllowance(spender, subtractedValue)
- Can only be called directly on the contract, not if this contract is being viewed through the interface from IERC20 (See above)
Therefore, when doing decentralized exchanges, some functions will not be accessible
