// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/core/Helpers.sol";
import "@account-abstraction/contracts/accounts/SimpleAccount.sol";

/**
 * Device2FAAccount
 *
 * MVP account model:
 * - Always requires the owner's signature.
 * - Additionally requires a device signature when the UserOperation is
 *   executing value >= `deviceValueThresholdWei`.
 *
 * Signature format:
 * - If value < threshold: `signature = ownerSig` (65 bytes)
 * - If value >= threshold: `signature = abi.encodePacked(ownerSig, deviceSig)` (130 bytes)
 *
 * Both signatures are ECDSA (secp256k1) over `userOpHash` (per SimpleAccount).
 */
contract Device2FAAccount is SimpleAccount {
    using ECDSA for bytes32;

    address public device;
    uint256 public deviceValueThresholdWei;

    event DeviceUpdated(address indexed device);
    event DeviceThresholdUpdated(uint256 thresholdWei);

    constructor(IEntryPoint anEntryPoint) SimpleAccount(anEntryPoint) {}

    function initialize(address anOwner, address device_, uint256 thresholdWei) public initializer {
        _initialize(anOwner);
        device = device_;
        deviceValueThresholdWei = thresholdWei;
        emit DeviceUpdated(device_);
        emit DeviceThresholdUpdated(thresholdWei);
    }

    function setDevice(address device_) external onlyOwner {
        device = device_;
        emit DeviceUpdated(device_);
    }

    function setDeviceValueThreshold(uint256 thresholdWei) external onlyOwner {
        deviceValueThresholdWei = thresholdWei;
        emit DeviceThresholdUpdated(thresholdWei);
    }

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal override returns (uint256 validationData) {
        bytes calldata sig = userOp.signature;

        // Always require owner signature.
        if (sig.length < 65) return SIG_VALIDATION_FAILED;
        bytes memory ownerSig = _slice(sig, 0, 65);
        if (owner != ECDSA.recover(userOpHash, ownerSig)) return SIG_VALIDATION_FAILED;

        if (_requiresDeviceSig(userOp.callData)) {
            if (device == address(0)) return SIG_VALIDATION_FAILED;
            if (sig.length < 130) return SIG_VALIDATION_FAILED;
            bytes memory devSig = _slice(sig, 65, 65);
            if (device != ECDSA.recover(userOpHash, devSig)) return SIG_VALIDATION_FAILED;
        }

        return SIG_VALIDATION_SUCCESS;
    }

    function _requiresDeviceSig(bytes calldata callData) internal view returns (bool) {
        if (callData.length < 4) return true;

        bytes4 sel;
        assembly {
            sel := calldataload(callData.offset)
        }

        if (sel == BaseAccount.execute.selector) {
            (, uint256 value, ) = abi.decode(callData[4:], (address, uint256, bytes));
            return value >= deviceValueThresholdWei;
        }

        if (sel == BaseAccount.executeBatch.selector) {
            (Call[] memory calls) = abi.decode(callData[4:], (Call[]));
            uint256 len = calls.length;
            for (uint256 i = 0; i < len; i++) {
                if (calls[i].value >= deviceValueThresholdWei) return true;
            }
            return false;
        }

        // Unknown call: be conservative (require device approval).
        return true;
    }

    function _slice(bytes calldata data, uint256 start, uint256 len) internal pure returns (bytes memory out) {
        out = new bytes(len);
        // solhint-disable-next-line no-inline-assembly
        assembly {
            calldatacopy(add(out, 0x20), add(data.offset, start), len)
        }
    }
}

