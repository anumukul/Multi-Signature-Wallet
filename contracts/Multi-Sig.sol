// SPDX-License-Identifier:MIT

pragma solidity >=0.8.0;

contract MultiSignatureWallet {
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public required;

    uint256 public constant MAX_OWNER_COUNT = 50;

    constructor(
        address[] memory _owners,
        uint256 _required
    ) validRequirement(_owners.length, _required) {
        require(_owners.length != 0, "Not valid owners");
        for (uint i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner address");
            require(!isOwner[_owners[i]], "Duplicate owner");
            isOwner[_owners[i]] = true;
        }

        owners = _owners;

        required = _required;
    }

    modifier OnlyOwner() {
        require(isOwner[msg.sender], "Not Authorized");
        _;
    }
    modifier validRequirement(uint256 ownerCount, uint256 _required) {
        require(ownerCount <= MAX_OWNER_COUNT, "Too many owners");

        require(
            _required <= ownerCount,
            "Required Signatures exceed owner count"
        );

        require(_required != 0, "required cannot be zero");

        require(ownerCount != 0, "Owner count cannot be zero");

        _;
    }

    event OwnerAddition(
        address indexed addedOwner,
        address indexed addedBy,
        uint256 timestamp
    );

    event OwnerRemoval(
        address indexed removedOwner,
        address indexed removedBy,
        uint256 timestamp
    );

    event OwnerReplacement(
        address indexed previousOwner,
        address indexed newOwner,
        address indexed replacedBy,
        uint256 timestamp
    );

    event RequirementChange(
        uint256 indexed previousRequired,
        uint256 indexed newRequired,
        address indexed changedBy,
        uint256 timestamp
    );

    struct Transaction {
        address destination;
        uint value;
        bytes data;
        bool executed;
        uint256 timestamp;
    }

    mapping(uint256 => Transaction) public transactions;

    uint256 public transactionCount;

    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(uint256 => uint256) public confirmationCount;

    event Submission(
        uint256 indexed transactionId,
        address indexed destination,
        uint256 value,
        bytes data,
        address indexed submittedBy,
        uint256 timestamp
    );

    event Confirmation(
        uint256 indexed transactionId,
        address indexed owner,
        uint256 confirmationCount,
        uint256 timestamp
    );

    event Revocation(
        uint256 indexed transactionId,
        address indexed owner,
        uint256 confirmationCount,
        uint256 timestamp
    );

    event Execution(
        uint256 indexed transactionId,
        address indexed destination,
        uint256 value,
        bool indexed success,
        bytes returnData,
        address executedBy,
        uint256 gasUsed,
        uint256 timestamp
    );

    event ExecutionFailure(
        uint256 indexed transactionId,
        address indexed destination,
        uint256 value,
        bytes reason,
        address attemptedBy,
        uint256 timestamp
    );

    event Deposit(address indexed sender, uint256 value, uint256 timestamp);

    event BatchExecution(
        uint256[] transactionIds,
        uint256 successCount,
        address indexed executedBy,
        uint256 timestamp
    );

    event PauseStateChanged(
        bool indexed paused,
        address indexed changedBy,
        uint256 timestamp
    );

    function addOwner(
        address newOwner
    ) external OnlyOwner validRequirement(owners.length + 1, required) {
        require(isOwner[newOwner] == false, "Owner already exists");
        require(newOwner != address(0), "Invalid address");

        owners.push(newOwner);
        isOwner[newOwner] = true;

        emit OwnerAddition(newOwner, msg.sender, block.timestamp);
    }

    function removeOwner(address ownerToRemove) external OnlyOwner {
        require(ownerToRemove != address(0), "Invalid address");

        require(isOwner[ownerToRemove], "Not an existing owner");

        require(
            owners.length - 1 >= required,
            "Cannot remove: would invalidate requirement"
        );

        uint index = 0;

        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == ownerToRemove) {
                index = i;
                break;
            }
        }

        for (uint i = index; i < owners.length - 1; i++) {
            owners[i] = owners[i + 1];
        }

        owners.pop();

        isOwner[ownerToRemove] = false;
        emit OwnerRemoval(ownerToRemove, msg.sender, block.timestamp);
    }

    function replaceOwner(
        address ownerToReplace,
        address newOwner
    ) external OnlyOwner {
        require(ownerToReplace != address(0), "Invalid address");
        require(newOwner != address(0), "Invalid address");
        require(isOwner[ownerToReplace], "Owner does not exist");
        require(!isOwner[newOwner], "owner already exist");

        uint index = 0;

        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == ownerToReplace) {
                index = i;
                break;
            }
        }

        owners[index] = newOwner;

        isOwner[ownerToReplace] = false;
        isOwner[newOwner] = true;

        emit OwnerReplacement(
            ownerToReplace,
            newOwner,
            msg.sender,
            block.timestamp
        );
    }

    function changeRequirement(
        uint256 _required
    ) external OnlyOwner validRequirement(owners.length, _required) {
        uint256 previous = required;

        required = _required;

        emit RequirementChange(
            previous,
            _required,
            msg.sender,
            block.timestamp
        );
    }
} // SPDX-License-Identifier:MIT

pragma solidity >=0.8.0;

contract MultiSignatureWallet {
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public required;

    uint256 public constant MAX_OWNER_COUNT = 50;

    constructor(
        address[] memory _owners,
        uint256 _required
    ) validRequirement(_owners.length, _required) {
        require(_owners.length != 0, "Not valid owners");
        for (uint i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "Invalid owner address");
            require(!isOwner[_owners[i]], "Duplicate owner");
            isOwner[_owners[i]] = true;
        }

        owners = _owners;

        required = _required;
    }

    modifier OnlyOwner() {
        require(isOwner[msg.sender], "Not Authorized");
        _;
    }
    modifier validRequirement(uint256 ownerCount, uint256 _required) {
        require(ownerCount <= MAX_OWNER_COUNT, "Too many owners");

        require(
            _required <= ownerCount,
            "Required Signatures exceed owner count"
        );

        require(_required != 0, "required cannot be zero");

        require(ownerCount != 0, "Owner count cannot be zero");

        _;
    }

    event OwnerAddition(
        address indexed addedOwner,
        address indexed addedBy,
        uint256 timestamp
    );

    event OwnerRemoval(
        address indexed removedOwner,
        address indexed removedBy,
        uint256 timestamp
    );

    event OwnerReplacement(
        address indexed previousOwner,
        address indexed newOwner,
        address indexed replacedBy,
        uint256 timestamp
    );

    event RequirementChange(
        uint256 indexed previousRequired,
        uint256 indexed newRequired,
        address indexed changedBy,
        uint256 timestamp
    );

    struct Transaction {
        address destination;
        uint value;
        bytes data;
        bool executed;
        uint256 timestamp;
    }

    mapping(uint256 => Transaction) public transactions;

    uint256 public transactionCount;

    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(uint256 => uint256) public confirmationCount;

    event Submission(
        uint256 indexed transactionId,
        address indexed destination,
        uint256 value,
        bytes data,
        address indexed submittedBy,
        uint256 timestamp
    );

    event Confirmation(
        uint256 indexed transactionId,
        address indexed owner,
        uint256 confirmationCount,
        uint256 timestamp
    );

    event Revocation(
        uint256 indexed transactionId,
        address indexed owner,
        uint256 confirmationCount,
        uint256 timestamp
    );

    event Execution(
        uint256 indexed transactionId,
        address indexed destination,
        uint256 value,
        bool indexed success,
        bytes returnData,
        address executedBy,
        uint256 gasUsed,
        uint256 timestamp
    );

    event ExecutionFailure(
        uint256 indexed transactionId,
        address indexed destination,
        uint256 value,
        bytes reason,
        address attemptedBy,
        uint256 timestamp
    );

    event Deposit(address indexed sender, uint256 value, uint256 timestamp);

    event BatchExecution(
        uint256[] transactionIds,
        uint256 successCount,
        address indexed executedBy,
        uint256 timestamp
    );

    event PauseStateChanged(
        bool indexed paused,
        address indexed changedBy,
        uint256 timestamp
    );

    function addOwner(
        address newOwner
    ) external OnlyOwner validRequirement(owners.length + 1, required) {
        require(isOwner[newOwner] == false, "Owner already exists");
        require(newOwner != address(0), "Invalid address");

        owners.push(newOwner);
        isOwner[newOwner] = true;

        emit OwnerAddition(newOwner, msg.sender, block.timestamp);
    }

    function removeOwner(address ownerToRemove) external OnlyOwner {
        require(ownerToRemove != address(0), "Invalid address");

        require(isOwner[ownerToRemove], "Not an existing owner");

        require(
            owners.length - 1 >= required,
            "Cannot remove: would invalidate requirement"
        );

        uint index = 0;

        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == ownerToRemove) {
                index = i;
                break;
            }
        }

        for (uint i = index; i < owners.length - 1; i++) {
            owners[i] = owners[i + 1];
        }

        owners.pop();

        isOwner[ownerToRemove] = false;
        emit OwnerRemoval(ownerToRemove, msg.sender, block.timestamp);
    }

    function replaceOwner(
        address ownerToReplace,
        address newOwner
    ) external OnlyOwner {
        require(ownerToReplace != address(0), "Invalid address");
        require(newOwner != address(0), "Invalid address");
        require(isOwner[ownerToReplace], "Owner does not exist");
        require(!isOwner[newOwner], "owner already exist");

        uint index = 0;

        for (uint i = 0; i < owners.length; i++) {
            if (owners[i] == ownerToReplace) {
                index = i;
                break;
            }
        }

        owners[index] = newOwner;

        isOwner[ownerToReplace] = false;
        isOwner[newOwner] = true;

        emit OwnerReplacement(
            ownerToReplace,
            newOwner,
            msg.sender,
            block.timestamp
        );
    }

    function changeRequirement(
        uint256 _required
    ) external OnlyOwner validRequirement(owners.length, _required) {
        uint256 previous = required;

        required = _required;

        emit RequirementChange(
            previous,
            _required,
            msg.sender,
            block.timestamp
        );
    }

    function submitTransaction(
        address _destination,
        uint256 _value,
        bytes memory _data
    ) external OnlyOwner returns (uint256 transactionId) {
        require(_destination != address(0), "Invalid destination");

        transactionId = transactionCount;

        transactions[transactionId] = Transaction({
            destination: _destination,
            value: _value,
            data: _data,
            executed: false,
            timestamp: block.timestamp
        });

        confirmations[transactionId][msg.sender] = true;
        confirmationCount[transactionId] = 1;

        transactionCount++;

        emit Submission(
            transactionId,
            _destination,
            _value,
            _data,
            msg.sender,
            block.timestamp
        );

        emit Confirmation(transactionId, msg.sender, 1, block.timestamp);

        return transactionId;
    }

    function confirmTransaction(uint256 _transactionId) external OnlyOwner {
        require(
            transactions[_transactionId].destination != address(0),
            "Transaction does not exist"
        );
        require(
            !transactions[_transactionId].executed,
            "Transaction already executed"
        );
        require(
            !confirmations[_transactionId][msg.sender],
            "Already confirmed"
        );

        confirmations[_transactionId][msg.sender] = true;
        confirmationCount[_transactionId] += 1;

        emit Confirmation(
            _transactionId,
            msg.sender,
            confirmationCount[_transactionId],
            block.timestamp
        );
    }

    function revokeConfirmation(uint256 _transactionId) external OnlyOwner {
        require(
            transactions[_transactionId].destination != address(0),
            "Transaction does not exist"
        );
        require(
            !transactions[_transactionId].executed,
            "Transaction already executed"
        );
        require(
            confirmations[_transactionId][msg.sender],
            "No confirmation to revoke"
        );

        confirmations[_transactionId][msg.sender] = false;
        confirmationCount[_transactionId] -= 1;
        emit Revocation(
            _transactionId,
            msg.sender,
            confirmationCount[_transactionId],
            block.timestamp
        );
    }

    function isConfirmed(uint256 _transactionId) public view returns (bool) {
        return confirmationCount[_transactionId] >= required;
    }

    function executeTransaction(uint256 _transactionId) external OnlyOwner {
        require(
            transactions[_transactionId].destination != address(0),
            "Not a valid transaction"
        );

        require(
            transactions[_transactionId].executed == false,
            "Transaction Already executed"
        );

        require(
            confirmationCount[_transactionId] >= required,
            "Not enough confirmations"
        );

        transactions[_transactionId].executed = true;

        address destination = transactions[_transactionId].destination;

        uint256 value = transactions[_transactionId].value;
        bytes memory data = transactions[_transactionId].data;

        uint256 gasStart = gasleft();

        (bool success, bytes memory returnData) = destination.call{
            value: value
        }(data);

        uint256 gasUsed = gasStart - gasleft();

        if (success) {
            emit Execution(
                _transactionId,
                destination,
                value,
                success,
                returnData,
                msg.sender,
                gasUsed,
                block.timestamp
            );
        } else {
            emit ExecutionFailure(
                _transactionId,
                destination,
                value,
                returnData,
                msg.sender,
                block.timestamp
            );
        }
    }
}
