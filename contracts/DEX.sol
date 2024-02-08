// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

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

        modifier onlyOwner {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    //Must check the owner of this contract has been an allowance to this contract
    //from the Token contract. Must call the allowance/approve function on the 
    //ERC20 token and approve that this contract can transfer tokens on their behalf
    function sell() external onlyOwner {
        //Check to see if the owner of this contract (DEX) has approved this contract to transfer tokens on its behalf
        //Then take the allowance and transfer it to this contract
        //This will allow users to buy the tokens from the contract and give proceeds to the owner of the contract
        uint allowance = associatedToken.allowance(msg.sender, address(this)); //Check how many tokens have access to
        require(allowance > 0, "Must give the contract an allowance of at least one token");
        bool sent = associatedToken.transferFrom(msg.sender, address(this), allowance); //Transfer the allowance to the contract 
        require(sent, "Failed to send the tokens");
    }

    //The owner should be able to withdraw at anytime
    function withdrawTokens() external onlyOwner {
        uint balance = getTokenBalance(); //See how many tokens this contract has access to
        associatedToken.transfer(msg.sender, balance); //Allow the owner of the tokens to withdraw all the tokens
    }

    //Allow coins to be purchased from this contract for a certain price

    function withdrawFunds() external onlyOwner {
        (bool sent, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(sent, "transaction failed");
    }

        function getPrice(uint numTokens) public view returns (uint) {
        return numTokens * price;
    }

    function buy(uint numTokens) external payable {
        //Make sure enough tokens in the contract to sell
        require(numTokens <= getTokenBalance(), "Insufficient balance of tokens");

        uint amount = getPrice(numTokens); //Get the required transaction amount
        //Make sure the amount sent is exactly the amount owed
        require(msg.value == amount, "Insufficient amount sent.");

        associatedToken.transfer(msg.sender, numTokens); //Sent the transaction owner the amount of tokens 
    }

    //Get the remaining balance of tokens within the contract
    function getTokenBalance() public view returns (uint) {
        return associatedToken.balanceOf(address(this));
    }
}
 