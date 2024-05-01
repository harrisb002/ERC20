// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

//Whoever deploys this contract is the one who wants to sell their token
//They will send the address of the token contract to this contract to say
//what token they want to sell. Can be extended so that anyone can sell any token.
contract DEX {
    ERC20 public associatedToken;
    IERC20 public weth; // Instance of the WETH contract
    uint price;
    address owner;

    //Must send a token that adheres to this interface
    //Once passed, it will load that contract within this contract
    //Allowing the access of the methods attached to the interface
    constructor(ERC20 _token, IERC20 _weth, uint _price) {
        associatedToken = _token; // Get IERC20 contract instance to use interface using the Squares contract
        weth = _weth; // Set the WETH contract instance
        owner = msg.sender;
        price = _price;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event Transfer(address indexed from, address indexed to, uint256 value);

    //Must check the owner of this contract has given an allowance to this contract
    //from the Token contract. Must call the allowance/approve function on the
    //ERC20 token and approve that this contract can transfer tokens on their behalf
    function transferAllowance() external onlyOwner {
        //Check to see if the owner of this contract (DEX) has approved this contract to transfer tokens on its behalf
        //Then take the allowance and transfer it to this contract
        uint allowance = associatedToken.allowance(msg.sender, address(this)); //Check how many tokens have access to(their allowance)
        console.log(
            "\nMaking sure there is an allowance for the address:",
            address(this)
        );
        console.log("transferAllowance: Its allowance is:", allowance);
        console.log(
            "transferAllowance: Its SQZ balance is currently:",
            getTokenBalance()
        );

        require(
            allowance > 0,
            "Must give the contract an allowance of at least one token"
        );
        emit Approval(msg.sender, address(this), allowance);

        console.log("\nTransferring SQZ from:", msg.sender);
        console.log("Transferring SQZ allowance to:", address(this));
        console.log("In the ammount of:", allowance);

        // Now allowed to buy amount of allowance in tokens from the contract and give proceeds to the owner of the contract
        bool sent = associatedToken.transferFrom(
            msg.sender,
            address(this),
            allowance
        ); //Transfer the allowance to the contract
        console.log("The amount transferred was:", allowance);
        console.log(
            "The Allowance balance of SQZ for address:",
            address(this),
            "is now:",
            associatedToken.balanceOf(address(this))
        );
        require(sent, "Failed to send the tokens"); // Proceeds go to owner of contract
        emit Transfer(msg.sender, address(this), allowance);
    }

    function transferWethAllowance() external {
        //Check to see if the owner of this contract (DEX) has approved this contract to transfer tokens on its behalf
        //Then take the allowance and transfer it to this contract
        uint allowance = weth.allowance(msg.sender, address(this)); //Check how many tokens have access to(their allowance)
        console.log(
            "\nMaking sure there is an WETH allowance for the address:",
            address(this)
        );
        console.log("transferWethAllowance: Its WETH allowance is:", allowance);
        console.log(
            "transferWethAllowance: Its SQZ balance is currently:",
            getTokenBalance()
        );

        require(
            allowance > 0,
            "Must give the contract an WETH allowance of at least one token"
        );
        emit Approval(msg.sender, address(this), allowance);

        console.log("\nTransferring WETH from:", msg.sender);
        console.log("Transferring WETH allowance to:", address(this));
        console.log("In the ammount of:", allowance);

        // Now allowed to buy amount of allowance in tokens from the contract and give proceeds to the owner of the contract
        bool sent = weth.transferFrom(msg.sender, address(this), allowance); //Transfer the allowance to the contract
        console.log("The amount transferred was:", allowance);
        console.log(
            "The Allowance balance of WETH for address(this):",
            address(this),
            "is now:",
            weth.balanceOf(address(this))
        );
        require(sent, "Failed to send the tokens"); // Proceeds go to owner of contract
        emit Transfer(msg.sender, address(this), allowance);
    }

    //Allow Tokens to be purchased from this contract if one has the allowance and for a certain price of WETH
    function buyTokensUsingWETH(uint256 amountOfWETH) external {
        require(amountOfWETH > 0, "\nMust send WETH");

        uint256 tokensToBuy = etherExchangeRate(amountOfWETH);
        console.log("Tokens to buy:", tokensToBuy);

        uint256 addrTokenBalance = getTokenBalance();
        console.log(
            "The Address buying SQZ using WETH is:",
            address(this),
            " and its SQZ allowance to buy is:",
            addrTokenBalance
        );
        console.log("Owner: ", msg.sender);
        console.log("Spender: ", address(this));

        console.log(
            "The WETH allowance for this contract buying tokens is: ",
            weth.allowance(msg.sender, address(this))
        );

        // Transfer WETH from the sender to this contract
        bool wethReceived = weth.transfer(msg.sender, amountOfWETH);
        require(wethReceived, "WETH transfer failed");

        console.log("Amount owed:", tokensToBuy * price);
        console.log("Amount paid:", amountOfWETH);

        associatedToken.transfer(msg.sender, tokensToBuy); // Send the transaction owner the amount of tokens

        console.log(
            "Sent the amount of: ",
            tokensToBuy,
            " SQZ Bought by WETH by",
            address(this)
        );

        console.log("Its SQZ Allowance is now", getTokenBalance());

        emit Transfer(address(this), msg.sender, tokensToBuy);
    }

    //Allow Ether to be purchased from this contract if one has the allowance and for a certain price
    function buyTokensUsingEther() external payable {
        require(msg.value > 0, "\nMust send ETH");

        uint256 tokensToBuy = etherExchangeRate(msg.value);
        console.log("Tokens to buy:", tokensToBuy);

        console.log("Amount owed:", tokensToBuy * price);
        console.log("Amount paid:", msg.value);

        uint256 addrTokenBalance = getTokenBalance();
        console.log(
            "The Address buying SQZ using Ether is:",
            address(this),
            " and its SQZ allowance to buy is:",
            addrTokenBalance
        );

        console.log("Amount of ETH sent:", msg.value);

        associatedToken.transfer(msg.sender, tokensToBuy); // Send the transaction owner the amount of tokens

        console.log(
            "Purchase of",
            tokensToBuy,
            " SQZ using Ether by",
            address(this)
        );
        console.log("Its SQZ Allowance is now", getTokenBalance());

        emit Transfer(address(this), msg.sender, tokensToBuy);
    }

    //The owner is able to withdraw tokens at anytime
    function withdrawTokens() external onlyOwner {
        uint256 contractTokenBalance = getTokenBalance();
        associatedToken.transfer(msg.sender, contractTokenBalance); //Allow the owner of the tokens to withdraw all the tokens
        console.log("The amount withdrawled was:", contractTokenBalance);

        emit Transfer(address(this), msg.sender, contractTokenBalance);
    }

    // Withdraw all of the Eth balance from contract
    function withdrawFunds() external onlyOwner {
        uint256 contractEthBalance = address(this).balance; // Use contract's Ether balance
        console.log("Ether balance of the contract:", contractEthBalance);

        (bool sent, ) = payable(msg.sender).call{value: contractEthBalance}("");
        require(sent, "Transaction failed");

        emit Transfer(address(this), msg.sender, address(this).balance);
    }

    // Returns the number of tokens the contract will give to the sender in exchange for
    // amountOfEtherOrWETH, which is a number representing a specific amount of Ether or WETH
    function etherExchangeRate(
        uint amountOfEtherOrWETH
    ) public view returns (uint) {
        uint amount = amountOfEtherOrWETH / price;
        console.log(
            "\nCalculating the number of tokens for",
            amountOfEtherOrWETH,
            "Ether/WETH which =",
            amount
        );

        return amount;
    }

    //  Returns the value of tokens owned by `account`.
    function getTokenBalance() public view returns (uint) {
        return associatedToken.balanceOf(address(this));
    }

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    // function allowance(address owner, address spender) external view returns (uint256);
}
