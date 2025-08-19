import { useState } from "react";
import {
  useReadContract,
  useWriteContract,
  useAccount,
  useWatchContractEvent,
} from "wagmi";
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_ABI } from "../contracts/MultiSigWallet";
import { formatEther } from "viem";


import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import LinearProgress from "@mui/material/LinearProgress";
import Alert from "@mui/material/Alert";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";

// MUI Icons
import HistoryIcon from "@mui/icons-material/History";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BoltIcon from "@mui/icons-material/Bolt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ErrorIcon from "@mui/icons-material/Error";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import UndoIcon from "@mui/icons-material/Undo";

const TransactionList = () => {
  const { address } = useAccount();
  const [filter, setFilter] = useState("all");
  const [confirmingTxId, setConfirmingTxId] = useState(null);
  const [revokingTxId, setRevokingTxId] = useState(null);
  const [executingTxId, setExecutingTxId] = useState(null);

  const [refetchTrigger, setRefetchTrigger] = useState(0);
  useWatchContractEvent({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    eventName: [
      "Submission",
      "Confirmation",
      "Revocation",
      "Execution",
      "Deposit",
      "TimeLockPeriodChanged",
      "PauseStateChanged",
      "RequirementChange",
    ],
    onLogs: () => setRefetchTrigger((t) => t + 1),
  });

  const { data: transactionCount } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "transactionCount",
    enabled: true,
    scopeKey: refetchTrigger,
  });

  const { data: transactionIds } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "getTransactionIds",
    args: [
      0n,
      transactionCount || 0n,
      filter === "pending" || filter === "all",
      filter === "executed" || filter === "all",
    ],
    enabled: !!transactionCount,
    scopeKey: refetchTrigger,
  });

  const { writeContract: confirmTx } = useWriteContract();
  const { writeContract: revokeTx } = useWriteContract();
  const { writeContract: executeTx } = useWriteContract();

  const handleConfirm = async (transactionId) => {
    setConfirmingTxId(transactionId);
    try {
      await confirmTx({
        address: MULTISIG_CONTRACT_ADDRESS,
        abi: MULTISIG_ABI,
        functionName: "confirmTransaction",
        args: [transactionId],
      });
    } finally {
      setConfirmingTxId(null);
    }
  };

  const handleRevoke = async (transactionId) => {
    setRevokingTxId(transactionId);
    try {
      await revokeTx({
        address: MULTISIG_CONTRACT_ADDRESS,
        abi: MULTISIG_ABI,
        functionName: "revokeConfirmation",
        args: [transactionId],
      });
    } finally {
      setRevokingTxId(null);
    }
  };

  const handleExecute = async (transactionId) => {
    setExecutingTxId(transactionId);
    try {
      await executeTx({
        address: MULTISIG_CONTRACT_ADDRESS,
        abi: MULTISIG_ABI,
        functionName: "executeTransaction",
        args: [transactionId],
      });
    } finally {
      setExecutingTxId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <HistoryIcon color="primary" sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Transaction History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor and manage wallet operations
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FilterAltIcon color="action" />
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All Transactions</MenuItem>
            <MenuItem value="pending">Pending Only</MenuItem>
            <MenuItem value="executed">Executed Only</MenuItem>
          </Select>
        </Box>
      </Box>

      {!transactionIds || transactionIds.length === 0 ? (
        <Card sx={{ borderRadius: 3, boxShadow: 4, p: 5, textAlign: "center", minHeight: 250 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <AccessTimeIcon color="disabled" sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h6" fontWeight="bold" mb={1}>
              No transactions yet
            </Typography>
            <Typography color="text.secondary" mb={2}>
              Your transaction history will appear here once you submit your first transaction to the vault.
            </Typography>
            <Alert icon={<BoltIcon color="warning" />} severity="info" sx={{ mt: 2 }}>
              Ready to receive transactions
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {transactionIds.map((txId) => (
              <Grid item xs={12} key={txId.toString()}>
                <TransactionItem
                  transactionId={txId}
                  onConfirm={handleConfirm}
                  onRevoke={handleRevoke}
                  onExecute={handleExecute}
                  isConfirming={confirmingTxId === txId}
                  isRevoking={revokingTxId === txId}
                  isExecuting={executingTxId === txId}
                  userAddress={address}
                  refetchTrigger={refetchTrigger}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

const TransactionItem = ({
  transactionId,
  onConfirm,
  onRevoke,
  onExecute,
  isConfirming,
  isRevoking,
  isExecuting,
  userAddress,
  refetchTrigger,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const { data: transaction } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "getTransaction",
    args: [transactionId],
    scopeKey: refetchTrigger,
  });

  const { data: confirmationCount } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "getConfirmationCount",
    args: [transactionId],
    scopeKey: refetchTrigger,
  });

  const { data: required } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "required",
    scopeKey: refetchTrigger,
  });

  const { data: userConfirmed } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "confirmations",
    args: [transactionId, userAddress],
    enabled: !!userAddress,
    scopeKey: refetchTrigger,
  });

  const { data: confirmations } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "getConfirmations",
    args: [transactionId],
    enabled: showDetails,
    scopeKey: refetchTrigger,
  });

  if (!transaction) {
    return (
      <Card sx={{ borderRadius: 2, boxShadow: 2, p: 2, mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 16, height: 16, bgcolor: "grey.300", borderRadius: "50%" }} />
            <Box sx={{ flex: 1 }}>
              <Box sx={{ width: "25%", height: 24, bgcolor: "grey.300", borderRadius: 1, mb: 1 }} />
              <Box sx={{ width: "50%", height: 18, bgcolor: "grey.300", borderRadius: 1 }} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const [destination, value, data, executed] = transaction;
  const isExecuted = executed;
  const canExecute = confirmationCount >= required && !isExecuted;
  const valueInEth = value ? formatEther(value) : "0";

  const statusInfo = (() => {
    if (isExecuted)
      return { color: "success.main", icon: <CheckCircleIcon color="success" />, text: "Executed" };
    if (canExecute) return { color: "warning.main", icon: <PlayCircleIcon color="warning" />, text: "Ready" };
    return { color: "info.main", icon: <AccessTimeIcon color="info" />, text: "Pending" };
  })();

  return (
    <Card sx={{
      borderRadius: 4,
      boxShadow: "0 8px 30px rgba(60,60,100,0.13)",
      bgcolor: "rgba(30,41,59,0.97)",
      position: "relative",
      transition: "0.3s",
      '&:hover': { boxShadow: 8 }
    }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 20, height: 20, bgcolor: statusInfo.color, borderRadius: "50%", boxShadow: 1 }} />
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                  TX #{transactionId.toString()}
                </Typography>
                {statusInfo.icon}
                <Box
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    fontWeight: "bold",
                    bgcolor: isExecuted
                      ? "success.light"
                      : canExecute
                      ? "warning.light"
                      : "info.light",
                    color: isExecuted
                      ? "success.dark"
                      : canExecute
                      ? "warning.dark"
                      : "info.dark",
                    border: 1,
                    borderColor: isExecuted
                      ? "success.main"
                      : canExecute
                      ? "warning.main"
                      : "info.main",
                  }}
                >
                  {statusInfo.text}
                </Box>
              </Box>
              <Box sx={{ fontSize: 14, color: "text.secondary", mt: 1 }}>
                <span style={{ fontWeight: "bold" }}>To:</span>{" "}
                <span style={{ fontFamily: "monospace" }}>
                  {destination?.slice(0, 10)}...{destination?.slice(-8)}
                </span>
                <br />
                <span style={{ fontWeight: "bold" }}>Value:</span>{" "}
                <span style={{ fontWeight: "bold", fontSize: 16 }}>
                  {Number.parseFloat(valueInEth).toFixed(4)} ETH
                </span>
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: "bold",
                  fontSize: 16,
                  boxShadow: 2,
                }}
              >
                {confirmationCount?.toString() || "0"}/{required?.toString() || "0"}
              </Box>
              <Typography variant="caption" color="text.secondary">
                signatures
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setShowDetails(!showDetails)} title="View Details">
              <VisibilityIcon color="action" />
            </IconButton>
            {!isExecuted && (
              <>
                {!userConfirmed ? (
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => onConfirm(transactionId)}
                    disabled={isConfirming}
                    startIcon={isConfirming ? <CircularProgress color="inherit" size={16} /> : <DoneAllIcon />}
                    sx={{ fontWeight: "bold" }}
                  >
                    {isConfirming ? "Confirming..." : "Confirm"}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="info"
                    size="small"
                    onClick={() => onRevoke(transactionId)}
                    disabled={isRevoking}
                    startIcon={isRevoking ? <CircularProgress color="inherit" size={16} /> : <UndoIcon />}
                  >
                    {isRevoking ? "Revoking..." : "Revoke"}
                  </Button>
                )}
                {canExecute && (
                  <Button
                    variant="contained"
                    color="warning"
                    size="small"
                    onClick={() => onExecute(transactionId)}
                    disabled={isExecuting}
                    startIcon={isExecuting ? <CircularProgress color="inherit" size={16} /> : <PlayCircleIcon />}
                  >
                    {isExecuting ? "Executing..." : "Execute"}
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* Details */}
        {showDetails && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: "grey.100", mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2">Destination Address</Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                      {destination}
                    </Typography>
                  </CardContent>
                </Card>
                <Card sx={{ bgcolor: "grey.100", mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2">Value</Typography>
                    <Typography variant="body2">{valueInEth} ETH</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: "grey.100", mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2">Progress</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((Number(confirmationCount) / Number(required)) * 100, 100)}
                      color={canExecute ? "warning" : isExecuted ? "success" : "info"}
                      sx={{ mt: 1, height: 12, borderRadius: 2 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {confirmationCount?.toString()}/{required?.toString()} confirmations required
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Card sx={{ bgcolor: "grey.100", mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2">Transaction Data</Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                  {data || "0x"}
                </Typography>
              </CardContent>
            </Card>
            {confirmations && confirmations.length > 0 && (
              <Card sx={{ bgcolor: "grey.100", mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" mb={1}>Confirmed by</Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {confirmations.map((addr, index) => (
                      <Box
                        key={index}
                        sx={{
                          bgcolor: "primary.light",
                          color: "primary.dark",
                          border: 1,
                          borderColor: "primary.main",
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          fontWeight: "bold",
                          fontSize: 14,
                          mr: 1,
                        }}
                        title={addr}
                      >
                        {addr.slice(0, 6)}...{addr.slice(-4)}
                        {addr.toLowerCase() === userAddress?.toLowerCase() && " (You)"}
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
            {canExecute && !isExecuted && (
              <Alert icon={<CheckCircleIcon color="success" />} severity="success" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Ready for Execution
                </Typography>
                <Typography variant="body2">
                  This transaction has sufficient confirmations and can be executed immediately.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionList;