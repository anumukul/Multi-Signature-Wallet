import { useState } from "react";
import { useBalance, useReadContract, useAccount, useWatchContractEvent } from "wagmi";
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_ABI } from "../contracts/MultiSigWallet";
import { formatEther } from "viem";


import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import GroupIcon from "@mui/icons-material/Group";
import SecurityIcon from "@mui/icons-material/Security";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BoltIcon from "@mui/icons-material/Bolt";
import Paper from "@mui/material/Paper";
import Fade from "@mui/material/Fade";

const WalletInfo = () => {
  const { address } = useAccount();
  const [copied, setCopied] = useState(false);

  const [refetchTrigger, setRefetchTrigger] = useState(0);
  useWatchContractEvent({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    eventName: [
      "Execution",
      "Deposit",
      "Submission",
      "Revocation",
      "Confirmation",
      "TimeLockPeriodChanged",
      "PauseStateChanged",
      "RequirementChange",
    ],
    onLogs: () => setRefetchTrigger((t) => t + 1),
  });

  const { data: balance } = useBalance({
    address: MULTISIG_CONTRACT_ADDRESS,
    scopeKey: refetchTrigger,
  });

  const { data: owners } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "getOwners",
    scopeKey: refetchTrigger,
  });

  const { data: required } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "required",
    scopeKey: refetchTrigger,
  });

  const { data: isOwner } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "isOwner",
    args: [address],
    scopeKey: refetchTrigger,
  });

  const { data: timeLockPeriod } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "timeLockPeriod",
    scopeKey: refetchTrigger,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(MULTISIG_CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const stats = [
    {
      icon: <AccountBalanceWalletIcon color="success" />,
      label: "Vault Balance",
      value: balance ? `${Number.parseFloat(formatEther(balance.value)).toFixed(4)} ETH` : "0 ETH",
      color: "success.main",
    },
    {
      icon: <GroupIcon color="primary" />,
      label: "Signature Ratio",
      value: owners ? `${required}/${owners.length}` : "0/0",
      color: "primary.main",
    },
    {
      icon: <SecurityIcon color="secondary" />,
      label: "Access Level",
      value: isOwner ? "Owner" : "Viewer",
      color: "secondary.main",
    },
    {
      icon: <AccessTimeIcon color="warning" />,
      label: "Time Lock",
      value: timeLockPeriod ? `${timeLockPeriod}s` : "Disabled",
      color: "warning.main",
    },
  ];

  return (
    <Fade in>
      <Box sx={{ mt: 2, mb: 4 }}>
        <Grid container spacing={2}>
          {stats.map((stat, index) => (
            <Grid item xs={12} md={3} key={stat.label}>
              <Paper
                elevation={6}
                sx={{
                  borderRadius: 4,
                  boxShadow: "0 8px 30px rgba(60,60,100,0.13)",
                  bgcolor: "rgba(30,41,59,0.97)",
                }}
              >
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  {stat.icon}
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">{stat.label}</Typography>
                    <Typography variant="h6" color={stat.color}>
                      {stat.value}
                    </Typography>
                  </Box>
                </CardContent>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper
          elevation={8}
          sx={{
            mt: 4,
            p: 3,
            position: "relative",
            borderRadius: 4,
            boxShadow: "0 8px 30px rgba(60,60,100,0.20)",
            bgcolor: "rgba(30,41,59,0.97)",
          }}
        >
          <CardContent>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <BoltIcon color="primary" sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: "uppercase" }}>
                      Contract Address
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1 }}>
                      <Chip
                        label={`${MULTISIG_CONTRACT_ADDRESS.slice(0, 8)}...${MULTISIG_CONTRACT_ADDRESS.slice(-8)}`}
                        variant="outlined"
                        sx={{ fontFamily: "monospace", fontSize: 16, fontWeight: "bold", px: 2 }}
                      />
                      <Tooltip title="Copy full address">
                        <span>
                          <IconButton size="small" onClick={handleCopy}>
                            {copied ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <ContentCopyIcon color="action" fontSize="small" />
                            )}
                          </IconButton>
                          <Typography variant="caption" color={copied ? "success.main" : "text.secondary"} sx={{ ml: 1, fontWeight: "bold" }}>
                            {copied ? "Copied!" : "Copy Full"}
                          </Typography>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4} sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", justifyContent: "flex-end" }}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                  Verified Contract
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Paper>
      </Box>
    </Fade>
  );
};

export default WalletInfo;