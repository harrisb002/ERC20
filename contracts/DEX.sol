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
    function transferSQZAllowance() external onlyOwner {
        console.log("\n\nWithin transferSQZAllowance:");
        //Check to see if the owner of this contract (DEX) has approved this contract to transfer tokens on its behalf
        //Then take the allowance and transfer it to this contract
        uint allowance = associatedToken.allowance(msg.sender, address(this)); //Check how many tokens have access to(their allowance)
        console.log(
            "\nMaking sure there is an allowance for the address:",
            address(this)
        );
        console.log("The Dex SQZ allowance is:", allowance);
        console.log("The DEX SQZ balance is currently:", getSqzTokenBalance());

        require(
            allowance > 0,
            "Must give the DEX contract a WETH allowance of at least one token"
        );
        emit Approval(msg.sender, address(this), allowance);

        console.log("\nOwner giving the allowance of SQZ to DEX:", msg.sender);
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
            "The balance of SQZ for address:",
            address(this),
            "is now:",
            associatedToken.balanceOf(address(this))
        );
        require(sent, "Failed to send the tokens"); // Proceeds go to owner of contract
        emit Transfer(msg.sender, address(this), allowance);
    }

    function transferWethAllowance() external onlyOwner {
        console.log("\n\nWithin transferWethAllowance:");
        //Check to see if the owner of this contract (DEX) has approved this contract to transfer tokens on its behalf
        //Then take the allowance and transfer it to this contract

        // function allowance(address owner, address spender)
        uint allowance = weth.allowance(msg.sender, address(this));

        require(
            allowance > 0,
            "Must give the DEX contract a WETH allowance of at least one token"
        );
        emit Approval(msg.sender, address(this), allowance);

        console.log("\nTransferring WETH from:", msg.sender);
        console.log("Transferring WETH allowance to DEX:", address(this));
        console.log("In the ammount of:", allowance);

        // Now allowed to buy amount of allowance in tokens from the contract and give proceeds to the owner of the contract
        // function transferFrom(address from, address to, uint256 value)
        bool sent = weth.transferFrom(msg.sender, address(this), allowance); //Transfer the allowance to the contract
        console.log("The amount transferred was:", allowance);
        console.log(
            "The Allowance balance of WETH for address(this) DEX Contract:",
            address(this),
            "is now:",
            weth.balanceOf(address(this))
        );
        require(sent, "Failed to send the tokens"); // Proceeds go to owner of contract
        emit Transfer(msg.sender, address(this), allowance);
    }

    //Allow Tokens to be purchased from this contract if one has the allowance and for a certain price of WETH
    function buyTokensUsingWETH(uint256 amountOfWETH) external {
        console.log("\n\nWithin buyTokensUsingWeth:");

        require(amountOfWETH > 0, "\nMust send WETH");

     // Safety check for approval for tokens by dex contract
 

        uint256 tokensToBuy = etherExchangeRate(amountOfWETH);
        console.log("Tokens to buy:", tokensToBuy);

        console.log("Amount paid in wei:", amountOfWETH);
        console.log("Amount owed in wei:", tokensToBuy * price);

        console.log("Owner: ", msg.sender);
        console.log(
            "Spender (DEX Contract who has been approved to have allowance): ",
            address(this)
        );

        uint256 addrTokenBalance = getSqzTokenBalance();
        console.log(
            "The Address (DEX contract) buying SQZ using WETH is:",
            address(this),
            " and its SQZ allowance to buy is:",
            addrTokenBalance
        );
        console.log("The message sender is: ", msg.sender);

        // Transfer WETH from to this contract in the amount
        bool wethReceived = weth.transfer(address(this), amountOfWETH);
        require(wethReceived, "WETH transfer failed");
        console.log("Sender of WETH (WETH CONTRACT): ", address(weth));
        console.log("Reciever (DEX Contract): ", address(this));
        console.log("Amount of weth sent in wei:", amountOfWETH);

        // Transfer(from, to, amount)
        emit Transfer(address(weth), address(this), tokensToBuy);

        // Send the transaction owner the amount of tokens
        bool sqzRecieved = associatedToken.transfer(msg.sender, tokensToBuy);
        require(sqzRecieved, "SQZ transfer failed");

        console.log("Sender of SQZ (SQZ CONTRACT): ", address(associatedToken));
        console.log(
            "Reciever (Contract who has been approved to have allowance): ",
            address(this)
        );
        console.log("Amount of weth sent in wei:", amountOfWETH);

        console.log("Dex token balance is now", getSqzTokenBalance());

        emit Transfer(address(this), msg.sender, tokensToBuy);

        uint256 sqzTokenBalance = getSqzTokenBalance();
        console.log(
            "\n\nDEX contract ",
            address(this),
            " SQZ balance is:",
            sqzTokenBalance
        );
        uint256 wethTokenBalance = getWethTokenBalance();
        console.log(
            "DEX contract ",
            address(this),
            " WETH balance is:",
            wethTokenBalance
        );
        uint256 sqzTokenAllowance = associatedToken.allowance(
            msg.sender,
            address(this)
        );

        console.log(
            "\n\nDEX contract ",
            address(this),
            " SQZ Allowance is:",
            sqzTokenAllowance
        );
        uint256 wethTokenAllowance = weth.allowance(msg.sender, address(this));
        console.log(
            "DEX contract ",
            address(this),
            " WETH Allowance is:",
            wethTokenAllowance
        );
    }

    //Allow Ether to be purchased from this contract if one has the allowance and for a certain price
    function buyTokensUsingEther() external payable {
        console.log("\n\nWithin buyTokensUsingEther:");

        require(msg.value > 0, "\nMust send ETH");

        uint256 tokensToBuy = etherExchangeRate(msg.value);
        console.log("Tokens to buy:", tokensToBuy);

        console.log("Amount paid in wei:", msg.value);
        console.log("Amount owed in wei:", tokensToBuy * price);

        uint256 addrTokenBalance = getSqzTokenBalance();
        console.log(
            "The Address buying SQZ using Ether is:",
            address(this),
            " and its SQZ allowance to buy is:",
            addrTokenBalance
        );

        console.log("Amount of wei sent:", msg.value);

        associatedToken.transfer(msg.sender, tokensToBuy); // Send the transaction owner the amount of tokens

        console.log(
            "Purchase of",
            tokensToBuy,
            " SQZ using Ether by",
            address(this)
        );
        console.log("Its SQZ Allowance is now", getSqzTokenBalance());

        emit Transfer(address(this), msg.sender, tokensToBuy);
    }

    //The owner is able to withdraw tokens at anytime
    function withdrawTokens() external onlyOwner {
        console.log("\n\nWithin withdrawTokens:");
        uint256 contractSQZBalance =  getSqzTokenBalance();
        require(contractSQZBalance > 0, "Contract must posses SQZ");

        //Allow the owner of the tokens to withdraw all the tokens
        associatedToken.transfer(msg.sender, contractSQZBalance);
        console.log("The amount withdrawled was:", contractSQZBalance);

        emit Transfer(address(this), msg.sender, contractSQZBalance);
    }

    // Withdraw all of the Eth balance from contract
    function withdrawEth() external onlyOwner {
        console.log("\n\nWithin withdrawEth:");

        uint256 contractWethBalance =  address(this).balance;
        require(contractWethBalance > 0, "Contract must posses ETH");

        // Use contract's Ether balance
        uint256 contractEthBalance = address(this).balance;
        console.log("Eth balance of the contract:", contractEthBalance);
        console.log("Balance of owner:", owner.balance);

        (bool sent, ) = owner.call{value: contractEthBalance}("");

        require(sent, "Transaction failed");

        console.log("Eth balance was sent to owner at address:", owner);

        uint contractEthBalanceUpdated = address(this).balance;
        console.log(
            "Updated Eth balance of the contract:",
            contractEthBalanceUpdated
        );
        console.log("Updated Balance of owner:", owner.balance);

        emit Transfer(address(this), owner, contractEthBalance);
    }

    // Withdraw all of the Weth balance from contract
    function withdrawWeth() external onlyOwner {
        console.log("\n\nWithin withdrawWETH:");

        uint256 contractWethBalance = weth.balanceOf(address(this));
        require(contractWethBalance > 0, "Contract must posses WETH");

        console.log("Balance of owner:", owner.balance);

        // Use contract's WETH balance
        console.log("Weth balance of the contract:", contractWethBalance);

        bool sent = weth.transfer(payable(owner), contractWethBalance);

        require(sent, "Transaction failed");

        console.log("Weth balance was sent to owner at address:", owner);
        console.log("Weth balance of owner:", weth.balanceOf(owner));

        contractWethBalance = weth.balanceOf(address(this));
        console.log("Weth balance of the contract:", contractWethBalance);
        console.log("Balance of owner:", owner.balance);

        emit Transfer(address(this), owner, address(this).balance);
    }

    // Returns the number of tokens the contract will give to the sender in exchange for
    // amountOfEtherOrWETH, which is a number representing a specific amount of Ether or WETH
    function etherExchangeRate(
        uint amountOfEtherOrWETH
    ) public view returns (uint) {
        uint amountTokens = amountOfEtherOrWETH / price;
        console.log(
            "\nCalculating the number of tokens for",
            amountOfEtherOrWETH,
            "wei which =",
            amountTokens
        );

        return amountTokens;
    }

    // Returing the Allowance of SQZ for the passed address (assumed) contract
    function getSqzTokenBalance() public view returns (uint) {
        uint amount = associatedToken.balanceOf(address(this));
        return amount;
    }

    // Returing the Allowance of WETH for the passed address (assumed) contract
    function getWethTokenBalance() public view returns (uint) {
        uint amount = weth.balanceOf(address(this));
        return amount;
    }
}
