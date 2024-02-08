// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

//Whoever deploys this contract is the one who wants to sell their token
//They will send the address of the token contract to this contract to say 
//what token they want to sell. Can be extended so that anyone can sell any token.
contract DEX  {
    IERC20 public associatedToken;
    uint price;
    address owner;

    //Must send a token that adheres to this interface
    //Once passed, it will load that contract within this contract
    //Allowing the access of the methods attached to the interface
    constructor(IERC20 _token, uint _price) {
        associatedToken = _token;
        owner = msg.sender;
        price = _price;
    }
}
 