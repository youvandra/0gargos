// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * ArgosGateway (no-bundler mode)
 *
 * Goal: still use a smart contract to gate execution behind an "approval" step.
 *
 * Flow:
 * 1) Off-chain device approval happens (ESP32 UI).
 * 2) Backend publishes an approval to this contract: approve(requestKey, actionHash, deviceSignature)
 * 3) Backend (or any executor) calls executeApproved(requestKey, target, value, data) which
 *    checks that keccak256(abi.encode(requestKey, target, value, data)) matches the approved hash.
 *
 * NOTE (MVP): deviceSignature is stored for audit but NOT yet validated on-chain.
 * Later we can enforce signature verification once the device signs the exact digest.
 */
contract ArgosGateway is Ownable {
    address public approver; // backend/operator key for MVP
    address public executor; // backend/operator key for MVP

    mapping(bytes32 => bytes32) public approvedActionHash; // requestKey => actionHash
    mapping(bytes32 => bool) public executed; // requestKey => executed

    event ApproverUpdated(address indexed approver);
    event ExecutorUpdated(address indexed executor);

    event Approved(
        bytes32 indexed requestKey,
        bytes32 indexed actionHash,
        address indexed approver,
        bytes deviceSignature
    );

    event Executed(
        bytes32 indexed requestKey,
        bytes32 indexed actionHash,
        address indexed target,
        uint256 value,
        bytes data
    );

    error NotApprover(address msgSender);
    error NotExecutor(address msgSender);
    error NotApproved(bytes32 requestKey);
    error AlreadyExecuted(bytes32 requestKey);
    error ActionMismatch(bytes32 expected, bytes32 got);
    error CallFailed(bytes data);

    constructor(address approver_, address executor_) Ownable(msg.sender) {
        approver = approver_;
        executor = executor_;
        emit ApproverUpdated(approver_);
        emit ExecutorUpdated(executor_);
    }

    function setApprover(address approver_) external onlyOwner {
        approver = approver_;
        emit ApproverUpdated(approver_);
    }

    function setExecutor(address executor_) external onlyOwner {
        executor = executor_;
        emit ExecutorUpdated(executor_);
    }

    function approve(bytes32 requestKey, bytes32 actionHash, bytes calldata deviceSignature) external {
        if (msg.sender != approver) revert NotApprover(msg.sender);
        approvedActionHash[requestKey] = actionHash;
        emit Approved(requestKey, actionHash, msg.sender, deviceSignature);
    }

    function computeActionHash(
        bytes32 requestKey,
        address target,
        uint256 value,
        bytes calldata data
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(requestKey, target, value, data));
    }

    function executeApproved(
        bytes32 requestKey,
        address target,
        uint256 value,
        bytes calldata data
    ) external returns (bytes memory ret) {
        if (msg.sender != executor) revert NotExecutor(msg.sender);
        if (executed[requestKey]) revert AlreadyExecuted(requestKey);

        bytes32 expected = approvedActionHash[requestKey];
        if (expected == bytes32(0)) revert NotApproved(requestKey);

        bytes32 got = keccak256(abi.encode(requestKey, target, value, data));
        if (got != expected) revert ActionMismatch(expected, got);

        executed[requestKey] = true;

        (bool ok, bytes memory out) = target.call{value: value}(data);
        if (!ok) revert CallFailed(out);

        emit Executed(requestKey, expected, target, value, data);
        return out;
    }

    receive() external payable {}
}

