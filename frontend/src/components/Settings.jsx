import React, { useState, useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useWatchContractEvent,
} from "wagmi";
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_ABI } from "../contracts/MultiSigWallet";
import { formatEther, parseEther } from "viem";


import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import CardContent from "@mui/material/CardContent";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";


import SecurityIcon from "@mui/icons-material/Security";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PaidIcon from "@mui/icons-material/Paid";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

const Settings = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState(0);
  const [dailyLimit, setDailyLimit] = useState("");
  const [weeklyLimit, setWeeklyLimit] = useState("");
  const [timeLockPeriod, setTimeLockPeriod] = useState("");

  const [refetchTrigger, setRefetchTrigger] = useState(0);
  useWatchContractEvent({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    eventName: [
      "TimeLockPeriodChanged",
      "PauseStateChanged",
      "RequirementChange",
      "Execution",
      "Submission",
      "Confirmation",
      "Revocation",
    ],
    onLogs: () => setRefetchTrigger((t) => t + 1),
  });

  const { data: isOwner } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "isOwner",
    args: [address],
    enabled: !!address,
    scopeKey: refetchTrigger,
  });

  const { data: currentDailyLimit } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "dailyLimit",
    scopeKey: refetchTrigger,
  });

  const { data: currentWeeklyLimit } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "weeklyLimit",
    scopeKey: refetchTrigger,
  });

  const { data: dailySpent } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "dailySpent",
    scopeKey: refetchTrigger,
  });

  const { data: weeklySpent } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "weeklySpent",
    scopeKey: refetchTrigger,
  });

  const { data: currentTimeLock } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "timeLockPeriod",
    scopeKey: refetchTrigger,
  });

  const { data: isPaused } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "paused",
    scopeKey: refetchTrigger,
  });

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSetDailyLimit = (e) => {
    e.preventDefault();
    if (!dailyLimit) return;

    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: "setDailyLimit",
      args: [parseEther(dailyLimit)],
    });
  };

  const handleSetWeeklyLimit = (e) => {
    e.preventDefault();
    if (!weeklyLimit) return;

    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: "setWeeklyLimit",
      args: [parseEther(weeklyLimit)],
    });
  };

  const handleSetTimeLock = (e) => {
    e.preventDefault();
    if (!timeLockPeriod) return;

    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: "setTimeLockPeriod",
      args: [Number.parseInt(timeLockPeriod)],
    });
  };

  const handlePause = () => {
    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: "pause",
    });
  };

  const handleUnpause = () => {
    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: "unpause",
    });
  };

  useEffect(() => {
    if (isSuccess) {
      setDailyLimit("");
      setWeeklyLimit("");
      setTimeLockPeriod("");
    }
  }, [isSuccess]);

  if (!isOwner) {
    return (
      <Box sx={{ mt: 3 }}>
        <Paper elevation={8} sx={{
          p: 4, mb: 2, textAlign: "center",
          background: "linear-gradient(135deg, #232a36 80%, #1e293b 100%)",
          borderRadius: 4, boxShadow: "0 8px 30px rgba(60,60,100,0.20)"
        }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <SecurityIcon color="primary" sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h5" fontWeight="bold" mb={1}>
            Access Restricted
          </Typography>
          <Typography color="text.secondary" mb={2}>
            Only wallet owners can modify settings and security parameters.
          </Typography>
          <Alert severity="warning" icon={<WarningAmberIcon />}>
            Owner privileges required. <br />
            <Typography variant="caption">Your current status: <b>Non-Owner</b></Typography>
          </Alert>
        </Paper>
      </Box>
    );
  }

  const tabs = [
    { label: "Spending Limits", icon: <PaidIcon /> },
    { label: "Time Lock", icon: <AccessTimeIcon /> },
    { label: "Security Controls", icon: <SecurityIcon /> },
  ];

  const formatTimelock = (seconds) => {
    if (!seconds || seconds === 0n) return "0 seconds";
    const numSeconds = Number(seconds);
    const days = Math.floor(numSeconds / 86400);
    const hours = Math.floor((numSeconds % 86400) / 3600);
    const minutes = Math.floor((numSeconds % 3600) / 60);
    const secs = numSeconds % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    return parts.join(" ");
  };

  const calculateProgress = (spent, limit) => {
    if (!spent || !limit || limit === 0n) return 0;
    return Math.min((Number(formatEther(spent)) / Number(formatEther(limit))) * 100, 100);
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={3}>
          <Paper elevation={6} sx={{
            bgcolor: "rgba(30,41,59,0.97)",
            borderRadius: 4,
            boxShadow: "0 8px 30px rgba(60,60,100,0.13)"
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PaidIcon color="success" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Daily Limit</Typography>
                  <Typography variant="h6">
                    {currentDailyLimit ? Number.parseFloat(formatEther(currentDailyLimit)).toFixed(2) : "0"} ETH
                  </Typography>
                </Box>
              </Box>
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" fontSize={12} color="text.secondary">
                  <span>Spent: {dailySpent ? Number.parseFloat(formatEther(dailySpent)).toFixed(4) : "0"} ETH</span>
                  <span>{Math.round(calculateProgress(dailySpent, currentDailyLimit))}%</span>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={calculateProgress(dailySpent, currentDailyLimit)}
                  color={
                    calculateProgress(dailySpent, currentDailyLimit) >= 90
                      ? "error"
                      : calculateProgress(dailySpent, currentDailyLimit) >= 75
                      ? "warning"
                      : "success"
                  }
                  sx={{ mt: 1, height: 8, borderRadius: 2 }}
                />
              </Box>
            </CardContent>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={6} sx={{
            bgcolor: "rgba(30,41,59,0.97)",
            borderRadius: 4,
            boxShadow: "0 8px 30px rgba(60,60,100,0.13)"
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PaidIcon color="info" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Weekly Limit</Typography>
                  <Typography variant="h6">
                    {currentWeeklyLimit ? Number.parseFloat(formatEther(currentWeeklyLimit)).toFixed(2) : "0"} ETH
                  </Typography>
                </Box>
              </Box>
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" fontSize={12} color="text.secondary">
                  <span>Spent: {weeklySpent ? Number.parseFloat(formatEther(weeklySpent)).toFixed(4) : "0"} ETH</span>
                  <span>{Math.round(calculateProgress(weeklySpent, currentWeeklyLimit))}%</span>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={calculateProgress(weeklySpent, currentWeeklyLimit)}
                  color={
                    calculateProgress(weeklySpent, currentWeeklyLimit) >= 90
                      ? "error"
                      : calculateProgress(weeklySpent, currentWeeklyLimit) >= 75
                      ? "warning"
                      : "success"
                  }
                  sx={{ mt: 1, height: 8, borderRadius: 2 }}
                />
              </Box>
            </CardContent>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={6} sx={{
            bgcolor: "rgba(30,41,59,0.97)",
            borderRadius: 4,
            boxShadow: "0 8px 30px rgba(60,60,100,0.13)"
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <AccessTimeIcon color="warning" />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Time Lock</Typography>
                  <Typography variant="h6">{formatTimelock(currentTimeLock)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {currentTimeLock && Number(currentTimeLock) > 0 ? "Active" : "Disabled"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper elevation={6} sx={{
            bgcolor: "rgba(30,41,59,0.97)",
            borderRadius: 4,
            boxShadow: "0 8px 30px rgba(60,60,100,0.13)"
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                {isPaused ? <PauseCircleIcon color="error" /> : <PlayCircleIcon color="success" />}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Wallet Status</Typography>
                  <Typography variant="h6" color={isPaused ? "error" : "success"}>
                    {isPaused ? "Paused" : "Active"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isPaused ? "All operations blocked" : "Fully operational"}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={6} sx={{ borderRadius: 4, boxShadow: "0 8px 30px rgba(60,60,100,0.13)" }}>
        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            background: "linear-gradient(90deg,#1e293b 80%,#232a36 100%)"
          }}
        >
          {tabs.map(tab => (
            <Tab key={tab.label} label={tab.label} icon={tab.icon} iconPosition="start" sx={{ fontWeight: "bold" }} />
          ))}
        </Tabs>
        <CardContent>
         
          {activeTab === 0 && (
            <Box>
              <Box component="form" onSubmit={handleSetDailyLimit} sx={{ maxWidth: 400 }}>
                <TextField
                  label="Set Daily Limit (ETH)"
                  variant="outlined"
                  fullWidth
                  type="number"
                  step="0.01"
                  value={dailyLimit}
                  onChange={e => setDailyLimit(e.target.value)}
                  placeholder="Enter daily limit"
                  margin="normal"
                />
                <Button
                  type="submit"
                  disabled={isPending || isConfirming || !dailyLimit}
                  variant="contained"
                  color="info"
                  fullWidth
                  sx={{ mt: 2 }}
                  startIcon={isPending || isConfirming ? <CircularProgress color="inherit" size={20} /> : <PaidIcon />}
                >
                  {isPending || isConfirming ? "Setting..." : "Set Daily Limit"}
                </Button>
              </Box>
              <Divider sx={{ my: 3 }} />
              <Box component="form" onSubmit={handleSetWeeklyLimit} sx={{ maxWidth: 400 }}>
                <TextField
                  label="Set Weekly Limit (ETH)"
                  variant="outlined"
                  fullWidth
                  type="number"
                  step="0.01"
                  value={weeklyLimit}
                  onChange={e => setWeeklyLimit(e.target.value)}
                  placeholder="Enter weekly limit"
                  margin="normal"
                />
                <Button
                  type="submit"
                  disabled={isPending || isConfirming || !weeklyLimit}
                  variant="contained"
                  color="info"
                  fullWidth
                  sx={{ mt: 2 }}
                  startIcon={isPending || isConfirming ? <CircularProgress color="inherit" size={20} /> : <PaidIcon />}
                >
                  {isPending || isConfirming ? "Setting..." : "Set Weekly Limit"}
                </Button>
              </Box>
            </Box>
          )}

         
          {activeTab === 1 && (
            <Box component="form" onSubmit={handleSetTimeLock} sx={{ maxWidth: 400 }}>
              <TextField
                label="Set Time Lock (seconds)"
                variant="outlined"
                fullWidth
                type="number"
                value={timeLockPeriod}
                onChange={e => setTimeLockPeriod(e.target.value)}
                placeholder="Enter time lock in seconds"
                margin="normal"
              />
              <Button
                type="submit"
                disabled={isPending || isConfirming || !timeLockPeriod}
                variant="contained"
                color="warning"
                fullWidth
                sx={{ mt: 2 }}
                startIcon={isPending || isConfirming ? <CircularProgress color="inherit" size={20} /> : <AccessTimeIcon />}
              >
                {isPending || isConfirming ? "Setting..." : "Set Time Lock"}
              </Button>
            </Box>
          )}

         
          {activeTab === 2 && (
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {isPaused ? <PauseCircleIcon color="error" /> : <PlayCircleIcon color="success" />}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Wallet Status</Typography>
                  <Typography variant="h6" color={isPaused ? "error" : "success"}>
                    {isPaused ? "Paused" : "Active"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isPaused ? "All operations blocked" : "Fully operational"}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={2}>
                {isPaused ? (
                  <Button
                    onClick={handleUnpause}
                    disabled={isPending || isConfirming}
                    variant="contained"
                    color="success"
                    startIcon={isPending || isConfirming ? <CircularProgress color="inherit" size={20} /> : <PlayCircleIcon />}
                  >
                    {isPending || isConfirming ? "Unpausing..." : "Unpause Wallet"}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    disabled={isPending || isConfirming}
                    variant="contained"
                    color="error"
                    startIcon={isPending || isConfirming ? <CircularProgress color="inherit" size={20} /> : <PauseCircleIcon />}
                  >
                    {isPending || isConfirming ? "Pausing..." : "Pause Wallet"}
                  </Button>
                )}
              </Box>
            </Box>
          )}

          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} icon={<ErrorIcon />}>
              <b>Operation Failed:</b> {error.shortMessage || error.message}
            </Alert>
          )}
          {isSuccess && (
            <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircleIcon />}>
              Settings Updated! Your wallet settings have been updated successfully.
            </Alert>
          )}
        </CardContent>
      </Paper>
    </Box>
  );
};

export default Settings;