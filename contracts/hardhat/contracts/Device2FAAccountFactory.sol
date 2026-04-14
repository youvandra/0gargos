// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@account-abstraction/contracts/interfaces/ISenderCreator.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

import "./Device2FAAccount.sol";

/**
 * Factory for Device2FAAccount.
 *
 * The factory is called through EntryPoint's SenderCreator during account deployment
 * from `initCode`.
 *
 * createAccount returns the account address even if already deployed, so
 * EntryPoint.getSenderAddress() works consistently.
 */
contract Device2FAAccountFactory {
    Device2FAAccount public immutable accountImplementation;
    ISenderCreator public immutable senderCreator;

    error NotSenderCreator(address msgSender, address entity, address senderCreator);

    constructor(IEntryPoint _entryPoint) {
        accountImplementation = new Device2FAAccount(_entryPoint);
        senderCreator = _entryPoint.senderCreator();
    }

    function createAccount(
        address owner,
        address device,
        uint256 thresholdWei,
        uint256 salt
    ) public returns (Device2FAAccount ret) {
        require(
            msg.sender == address(senderCreator),
            NotSenderCreator(msg.sender, address(this), address(senderCreator))
        );

        address addr = getAddress(owner, device, thresholdWei, salt);
        if (addr.code.length > 0) {
            return Device2FAAccount(payable(addr));
        }

        ret = Device2FAAccount(
            payable(
                new ERC1967Proxy{salt: bytes32(salt)}(
                    address(accountImplementation),
                    abi.encodeCall(Device2FAAccount.initialize, (owner, device, thresholdWei))
                )
            )
        );
    }

    function getAddress(
        address owner,
        address device,
        uint256 thresholdWei,
        uint256 salt
    ) public view returns (address) {
        return
            Create2.computeAddress(
                bytes32(salt),
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(
                            address(accountImplementation),
                            abi.encodeCall(Device2FAAccount.initialize, (owner, device, thresholdWei))
                        )
                    )
                )
            );
    }
}

