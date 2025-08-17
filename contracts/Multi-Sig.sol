// SPDX-License-Identifier:MIT

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

pragma solidity >=0.8.0;

contract MultiSignatureWallet is ReentrancyGuard{
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint public required;

    uint256 public constant MAX_OWNER_COUNT = 50;

    uint256 public timeLockPeriod=10; //in seconds

    uint256 public dailyLimit;
    uint256 public weeklyLimit;


    uint256 public dailySpent;
    uint256 public weeklySpent;

    uint256 public lastDailyReset;
    uint256 public lastWeeklyReset;

    bool public paused;

    uint256 public nonce;

    mapping(address => bool) public isGuardian;
address[] public guardians;


    

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

        lastDailyReset=block.timestamp;
        lastWeeklyReset=block.timestamp;
    }

    modifier OnlyOwner() {
        require(isOwner[msg.sender], "Not Authorized");
        _;
    }
    modifier validRequirement(uint256 ownerCount, uint256 _required) {
        require(ownerCount <= MAX_OWNER_COUNT, "Too many owners");
        require(_required <= ownerCount, "Required Signatures exceed owner count");
        require(_required != 0, "required cannot be zero");
        require(ownerCount != 0, "Owner count cannot be zero");
        _;
    }

    modifier whenNotPaused() {
    require(!paused, "Wallet is paused");
    _;
}
modifier whenPaused() {
    require(paused, "Wallet is not paused");
    _;
}

    event OwnerAddition(address indexed addedOwner, address indexed addedBy, uint256 timestamp);
    event OwnerRemoval(address indexed removedOwner, address indexed removedBy, uint256 timestamp);
    event OwnerReplacement(address indexed previousOwner, address indexed newOwner, address indexed replacedBy, uint256 timestamp);
    event RequirementChange(uint256 indexed previousRequired, uint256 indexed newRequired, address indexed changedBy, uint256 timestamp);

    event TimeLockPeriodChanged(uint256 oldPeriod, uint256 newPeriod, address changedBy, uint256 timestamp);

    struct Transaction {
        address destination;
        uint value;
        bytes data;
        bool executed;
        uint256 timestamp;
    }

    mapping(uint256 => Transaction) public transactions;
    uint256[] public transactionIds;
    uint256 public transactionCount;

    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(uint256 => uint256) public confirmationCount;

    event Submission(uint256 indexed transactionId, address indexed destination, uint256 value, bytes data, address indexed submittedBy, uint256 timestamp);
    event Confirmation(uint256 indexed transactionId, address indexed owner, uint256 confirmationCount, uint256 timestamp);
    event Revocation(uint256 indexed transactionId, address indexed owner, uint256 confirmationCount, uint256 timestamp);
    event Execution(uint256 indexed transactionId, address indexed destination, uint256 value, bool indexed success, bytes returnData, address executedBy, uint256 gasUsed, uint256 timestamp);
    event ExecutionFailure(uint256 indexed transactionId, address indexed destination, uint256 value, bytes reason, address attemptedBy, uint256 timestamp);
    event Deposit(address indexed sender, uint256 value, uint256 timestamp);
    event BatchExecution(uint256[] transactionIds, uint256 successCount, address indexed executedBy, uint256 timestamp);
    event PauseStateChanged(bool indexed paused, address indexed changedBy, uint256 timestamp);

    event EmergencyRecovery(
    address[] newOwners,
    uint256 newRequired,
    address indexed triggeredBy,
    uint256 timestamp
);

    event GuardianAdded(address indexed guardian, address indexed addedBy, uint256 timestamp);
event GuardianRemoved(address indexed guardian, address indexed removedBy, uint256 timestamp);

    function setTimeLockPeriod(uint256 _period) external OnlyOwner whenNotPaused{

      uint256 oldPeriod=timeLockPeriod;

      timeLockPeriod=_period;
      emit TimeLockPeriodChanged(oldPeriod,_period,msg.sender,block.timestamp);
    }




    function addOwner(address newOwner) external OnlyOwner validRequirement(owners.length + 1, required) whenNotPaused {
        require(isOwner[newOwner] == false, "Owner already exists");
        require(newOwner != address(0), "Invalid address");
        owners.push(newOwner);
        isOwner[newOwner] = true;
        emit OwnerAddition(newOwner, msg.sender, block.timestamp);
    }

    function removeOwner(address ownerToRemove) external OnlyOwner whenNotPaused {
        require(ownerToRemove != address(0), "Invalid address");
        require(isOwner[ownerToRemove], "Not an existing owner");
        require(owners.length - 1 >= required, "Cannot remove: would invalidate requirement");
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

    function replaceOwner(address ownerToReplace, address newOwner) external OnlyOwner whenNotPaused {
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
        emit OwnerReplacement(ownerToReplace, newOwner, msg.sender, block.timestamp);
    }

    function changeRequirement(uint256 _required) external OnlyOwner validRequirement(owners.length, _required) whenNotPaused {
        uint256 previous = required;
        required = _required;
        emit RequirementChange(previous, _required, msg.sender, block.timestamp);
    }

    function submitTransaction(address _destination, uint256 _value, bytes memory _data) external OnlyOwner whenNotPaused returns (uint256 transactionId) {
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
        transactionIds.push(transactionId);
        emit Submission(transactionId, _destination, _value, _data, msg.sender, block.timestamp);
        emit Confirmation(transactionId, msg.sender, 1, block.timestamp);
        return transactionId;
    }

    function confirmTransaction(uint256 _transactionId) external OnlyOwner whenNotPaused {
        require(transactions[_transactionId].destination != address(0), "Transaction does not exist");
        require(!transactions[_transactionId].executed, "Transaction already executed");
        require(!confirmations[_transactionId][msg.sender], "Already confirmed");
        confirmations[_transactionId][msg.sender] = true;
        confirmationCount[_transactionId] += 1;
        emit Confirmation(_transactionId, msg.sender, confirmationCount[_transactionId], block.timestamp);
    }

    function revokeConfirmation(uint256 _transactionId) external OnlyOwner  whenNotPaused{
        require(transactions[_transactionId].destination != address(0), "Transaction does not exist");
        require(!transactions[_transactionId].executed, "Transaction already executed");
        require(confirmations[_transactionId][msg.sender], "No confirmation to revoke");
        confirmations[_transactionId][msg.sender] = false;
        confirmationCount[_transactionId] -= 1;
        emit Revocation(_transactionId, msg.sender, confirmationCount[_transactionId], block.timestamp);
    }

    function isConfirmed(uint256 _transactionId) public view returns (bool) {
        return confirmationCount[_transactionId] >= required;
    }

    function executeTransaction(uint256 _transactionId) external OnlyOwner whenNotPaused nonReentrant {

       _resetSpendingCounters();



        require(transactions[_transactionId].destination != address(0), "Not a valid transaction");
        require(transactions[_transactionId].executed == false, "Transaction Already executed");
        require(confirmationCount[_transactionId] >= required, "Not enough confirmations");
         require(block.timestamp >= transactions[_transactionId].timestamp + timeLockPeriod, "Time lock not expired");

    

        transactions[_transactionId].executed = true;
        address destination = transactions[_transactionId].destination;
        uint256 value = transactions[_transactionId].value;
        bytes memory data = transactions[_transactionId].data;
        uint256 gasStart = gasleft();

             require(dailySpent + value <= dailyLimit, "Exceeds daily limit");
    require(weeklySpent + value <= weeklyLimit, "Exceeds weekly limit");



        (bool success, bytes memory returnData) = destination.call{value: value}(data);
        uint256 gasUsed = gasStart - gasleft();
        if (success) {

              dailySpent += value;
weeklySpent += value;

nonce++;
            emit Execution(_transactionId, destination, value, success, returnData, msg.sender, gasUsed, block.timestamp);
        } else {
            emit ExecutionFailure(_transactionId, destination, value, returnData, msg.sender, block.timestamp);
        }
    }

    function batchConfirmation(uint256[] memory _transactionIds) external OnlyOwner whenNotPaused {


      
        require(_transactionIds.length > 0, "Not a valid Input");
         require(_transactionIds.length <= 50, "Too many txs");

          for (uint i = 0; i < _transactionIds.length; i++) {
        require(_transactionIds[i] < transactionCount, "Invalid transaction id");
        for (uint j = i + 1; j < _transactionIds.length; j++) {
            require(_transactionIds[i] != _transactionIds[j], "Duplicate transaction id");
        }
    }
        for (uint i = 0; i < _transactionIds.length; i++) {
            uint256 txId = _transactionIds[i];
            if (
                transactions[txId].destination == address(0) ||
                transactions[txId].executed ||
                confirmations[txId][msg.sender] ||  block.timestamp<transactions[txId].timestamp + timeLockPeriod

            ) {
                continue;
            }
            confirmations[txId][msg.sender] = true;
            confirmationCount[txId] += 1;
            emit Confirmation(txId, msg.sender, confirmationCount[txId], block.timestamp);
        }
    }

    function batchExecution(uint256[] memory _transactionIds) external OnlyOwner whenNotPaused nonReentrant {

      _resetSpendingCounters();

        require(_transactionIds.length > 0, "Not a valid Input");
        require(_transactionIds.length <= 50, "Too many txs");

        for (uint i = 0; i < _transactionIds.length; i++) {
        require(_transactionIds[i] < transactionCount, "Invalid transaction id");
        for (uint j = i + 1; j < _transactionIds.length; j++) {
            require(_transactionIds[i] != _transactionIds[j], "Duplicate transaction id");
        }
    }
        uint successCount = 0;
        for (uint i = 0; i < _transactionIds.length; i++) {
            uint256 txId = _transactionIds[i];

            uint256 value = transactions[txId].value;
            bytes memory data = transactions[txId].data;
            uint256 gasStart = gasleft();
            if (
                transactions[txId].destination == address(0) ||
                transactions[txId].executed ||
                confirmationCount[txId] < required || dailySpent + value >dailyLimit || weeklySpent + value > weeklyLimit || block.timestamp<transactions[txId].timestamp + timeLockPeriod
            ) {
                continue;
            }
            transactions[txId].executed = true;
            address destination = transactions[txId].destination;
            
            (bool success, bytes memory returnData) = destination.call{value: value}(data);
            uint256 gasUsed = gasStart - gasleft();
            if (success) {
                successCount += 1;

                dailySpent += value;
weeklySpent += value;

    nonce++;
                emit Execution(txId, destination, value, success, returnData, msg.sender, gasUsed, block.timestamp);
            } else {
                emit ExecutionFailure(txId, destination, value, returnData, msg.sender, block.timestamp);
            }
        }
        emit BatchExecution(_transactionIds, successCount, msg.sender, block.timestamp);
    }

    function getTransactionCount(bool pending, bool executed) public view returns (uint256 count) {
        for (uint256 i = 0; i < transactionIds.length; i++) {
            uint256 txId = transactionIds[i];
            if (
                (pending && !transactions[txId].executed) ||
                (executed && transactions[txId].executed)
            ) {
                count++;
            }
        }
        return count;
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getConfirmationCount(uint256 transactionId) public view returns (uint256) {
        return confirmationCount[transactionId];
    }

    function getTransactionIds(uint256 from, uint256 to, bool pending, bool executed) public view returns (uint256[] memory _transactionIds) {
        require(to <= transactionIds.length, "Invalid 'to' parameter");
        require(from < to, "'from' must be less than 'to'");
        uint256[] memory temp = new uint256[](to - from);
        uint256 count = 0;
        for (uint256 i = from; i < to; i++) {
            uint256 txId = transactionIds[i];
            if (
                (pending && !transactions[txId].executed) ||
                (executed && transactions[txId].executed)
            ) {
                temp[count] = txId;
                count++;
            }
        }
        _transactionIds = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            _transactionIds[j] = temp[j];
        }
        return _transactionIds;
    }

    function getConfirmations(uint256 transactionId) public view returns (address[] memory _confirmations) {
        uint256 count = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) {
                count++;
            }
        }
        _confirmations = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (confirmations[transactionId][owners[i]]) {
                _confirmations[idx] = owners[i];
                idx++;
            }
        }
        return _confirmations;
    }

    function getTransaction(uint256 transactionId)
        public
        view
        returns (
            address destination,
            uint256 value,
            bytes memory data,
            bool executed
        )
    {
        Transaction storage txn = transactions[transactionId];
        return (txn.destination, txn.value, txn.data, txn.executed);
    }

    receive() external payable{

      emit Deposit(msg.sender,msg.value,block.timestamp);



    }

    fallback() external payable{

      emit Deposit(msg.sender,msg.value,block.timestamp);
    }

    function setDailyLimit(uint256 _limit) external OnlyOwner whenNotPaused{

      dailyLimit=_limit;





    }

    function setWeeklyLimit(uint256 _limit) external OnlyOwner whenNotPaused{

      weeklyLimit=_limit;


    }

    function _resetSpendingCounters() internal {
    
    if (block.timestamp >= lastDailyReset + 1 days) {
        dailySpent = 0;
        lastDailyReset = block.timestamp;
    }
    
    if (block.timestamp >= lastWeeklyReset + 7 days) {
        weeklySpent = 0;
        lastWeeklyReset = block.timestamp;
    }
}

function pause() external OnlyOwner {
    paused = true;
    emit PauseStateChanged(true, msg.sender, block.timestamp);
}

function unpause() external OnlyOwner {
    paused = false;
    emit PauseStateChanged(false, msg.sender, block.timestamp);
}

function addGuardian(address guardian) external OnlyOwner {
    require(guardian != address(0), "Invalid guardian address");
    require(!isGuardian[guardian], "Already a guardian");
    isGuardian[guardian] = true;
    guardians.push(guardian);

    emit GuardianAdded(guardian, msg.sender, block.timestamp);
}

function removeGuardian(address guardian) external OnlyOwner {
    require(isGuardian[guardian], "Not a guardian");
    isGuardian[guardian] = false;
    
    for (uint i = 0; i < guardians.length; i++) {
        if (guardians[i] == guardian) {
            guardians[i] = guardians[guardians.length - 1];
            guardians.pop();
            break;
        }
    }

    emit GuardianRemoved(guardian, msg.sender, block.timestamp);
}

function emergencyRecover(address[] memory newOwners, uint newRequired) external whenPaused {
    require(isGuardian[msg.sender], "Not guardian");

    require(newOwners.length > 0, "Owner list empty");
   
    for (uint i = 0; i < newOwners.length; i++) {
        require(newOwners[i] != address(0), "Zero address in owners");
        for (uint j = i + 1; j < newOwners.length; j++) {
            require(newOwners[i] != newOwners[j], "Duplicate owner address");
        }
    }
    
    for (uint i = 0; i < owners.length; i++) {
        isOwner[owners[i]] = false;
    }
    owners = newOwners;
    for (uint i = 0; i < newOwners.length; i++) {
        isOwner[newOwners[i]] = true;
    }
    required = newRequired;
    emit RequirementChange(required, newRequired, msg.sender, block.timestamp);
     emit EmergencyRecovery(newOwners, newRequired, msg.sender, block.timestamp);
}

function guardianUnpause() external whenPaused {
    require(isGuardian[msg.sender], "Not guardian");
    paused = false;
    emit PauseStateChanged(false, msg.sender, block.timestamp);
}

 function getGuardians() public view returns (address[] memory) {
        return guardians;
    }


}