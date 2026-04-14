// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ArgosDemo {
    event Ping(address indexed from, uint256 indexed n);

    uint256 public counter;

    function ping() external {
        counter += 1;
        emit Ping(msg.sender, counter);
    }
}

