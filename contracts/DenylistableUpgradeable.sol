// SPDX-License-Identifier: MIT

pragma solidity 0.8.15;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

error IsNotDenylisted(address denylistee);
error IsDenylisted(address denylistee);

/**
 * @dev Contract module which allows children to implement an denylist
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotDenylisted` and `whenDenylisted` which can be applied to
 * the functions of your contract. Note that they will not be denylistable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract DenylistableUpgradeable is Initializable, ContextUpgradeable {
    /**
     * @dev Emitted when a `denylister` denylists a `denylistee`.
     */
    event Denylist(address indexed denylister, address indexed denylistee);

    /**
     * @dev Emitted when `denylister` undenylists a `denylistee`.
     */
    event Undenylist(address indexed denylister, address indexed denylistee);

    mapping(address => bool) internal denylisted;

    /**
     * @dev Initializes the contract in empty denylisted state.
     */
    function __Denylistable_init() internal onlyInitializing {
        __Denylistable_init_unchained();
    }

    function __Denylistable_init_unchained() internal onlyInitializing {}

    /**
     * @dev Modifier to make a function callable only when a denylistee is not denylisted.
     */
    modifier whenNotDenylisted(address denylistee) {
        _requireIsNotDenylisted(denylistee);
        _;
    }

    /**
     * @dev Modifier to make a function callable only when a denylistee is denylisted.
     */
    modifier whenDenylisted(address denylistee) {
        _requireIsDenylisted(denylistee);
        _;
    }

    /**
     * @dev Returns true if the denylistee is denylisted, and false otherwise.
     */
    function isDenylisted(address denylistee)
        public
        view
        virtual
        returns (bool)
    {
        return denylisted[denylistee];
    }

    /**
     * @dev Throws if the denylistee is denylisted.
     */
    function _requireIsNotDenylisted(address denylistee) internal view virtual {
        if (isDenylisted(denylistee)) {
            revert IsDenylisted({denylistee: denylistee});
        }
    }

    /**
     * @dev Throws if the denylistee is not denylisted.
     */
    function _requireIsDenylisted(address denylistee) internal view virtual {
        if (!isDenylisted(denylistee)) {
            revert IsNotDenylisted({denylistee: denylistee});
        }
    }

    /**
     * @dev Denylists a denylistee.
     */
    function _denylist(address denylistee)
        internal
        virtual
        whenNotDenylisted(denylistee)
    {
        denylisted[denylistee] = true;
        emit Denylist({denylister: _msgSender(), denylistee: denylistee});
    }

    /**
     * @dev Undenylists a denylistee.
     */
    function _undenylist(address denylistee)
        internal
        virtual
        whenDenylisted(denylistee)
    {
        denylisted[denylistee] = false;
        emit Undenylist({denylister: _msgSender(), denylistee: denylistee});
    }

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[49] private __gap;
}
