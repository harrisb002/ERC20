// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {

    constructor(uint initialSupply) ERC20("weth", "WETH") {//Call ERC20 base contract constructor
    // _mint => Creates a certain amount of tokens and assigns to the deployer of the contract.
    // Internal function and must be called within the smart contract
        _mint(msg.sender, initialSupply); //Thus only this address can mint tokens. Limiting and can be update with more addresses
    }
}