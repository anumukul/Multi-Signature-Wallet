import React, { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_ABI } from "../contracts/MultiSigWallet";


import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import InfoIcon from "@mui/icons-material/Info";
import SecurityIcon from "@mui/icons-material/Security";
import GroupIcon from "@mui/icons-material/Group";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SettingsIcon from "@mui/icons-material/Settings";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonIcon from "@mui/icons-material/Person";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";

const OwnerManagement = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState(0);
  const [newOwner, setNewOwner] = useState("");
  const [ownerToRemove, setOwnerToRemove] = useState("");
  const [ownerToReplace, setOwnerToReplace] = useState("");
  const [replacementOwner, setReplacementOwner] = useState("");
  const [newRequirement, setNewRequirement] = useState("");

  const { data: owners = [] } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "getOwners",
    watch: true,
  });

  const { data: required } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "required",
    watch: true,
  });

  const { data: isOwner } = useReadContract({
    address: MULTISIG_CONTRACT_ADDRESS,
    abi: MULTISIG_ABI,
    functionName: "isOwner",
    args: [address],
    enabled: !!address,
  });

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      setNewOwner("");
      setOwnerToRemove("");
      setOwnerToReplace("");
      setReplacementOwner("");
      setNewRequirement("");
    }
  }, [isSuccess]);

  const tabs = [
    { label: "Current Owners", icon: <GroupIcon /> },
    { label: "Add Owner", icon: <AddIcon /> },
    { label: "Remove Owner", icon: <RemoveIcon /> },
    { label: "Replace Owner", icon: <SwapHorizIcon /> },
    { label: "Change Requirement", icon: <SettingsIcon /> },
  ];

  const getSecurityLevel = () => {
    if (!owners?.length || !required) return "Unknown";
    const ratio = Number(required) / owners.length;
    if (ratio >= 0.75) return "Very High";
    if (ratio >= 0.5) return "High";
    if (ratio >= 0.33) return "Medium";
    return "Low";
  };

  const securityLevel = getSecurityLevel();
  const securityColor = {
    "Very High": "success.main",
    High: "info.main",
    Medium: "warning.main",
    Low: "error.main",
    Unknown: "grey.600",
  }[securityLevel];

  const handleAddOwner = (e) => {
    e.preventDefault();
    if (!newOwner) return;
    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: "addOwner",
      args: [newOwner],
    });
  };

  const handleRemoveOwner = (e) => {
    e.preventDefault();
    if (!ownerToRemove) return;
    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: "removeOwner",
      args: [ownerToRemove],
    });
  };

  const handleReplaceOwner = (e) => {
    e.preventDefault();
    if (!ownerToReplace || !replacementOwner) return;
    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: "replaceOwner",
      args: [ownerToReplace, replacementOwner],
    });
  };

  const handleChangeRequirement = (e) => {
    e.preventDefault();
    if (!newRequirement) return;
    writeContract({
      address: MULTISIG_CONTRACT_ADDRESS,
      abi: MULTISIG_ABI,
      functionName: "changeRequirement",
      args: [Number.parseInt(newRequirement)],
    });
  };


  if (!isOwner) {
    return (
      <Box sx={{ mt: 3 }}>
        <Paper elevation={8} sx={{
          p: 4, mb: 2, textAlign: "center",
          background: "linear-gradient(135deg, #232a36 80%, #1e293b 100%)",
          borderRadius: 4, boxShadow: "0 8px 30px rgba(60,60,100,0.20)"
        }}>
          <CardHeader
            avatar={<SecurityIcon color="primary" sx={{ fontSize: 48 }} />}
            title={
              <Typography variant="h5" fontWeight="bold">
                Access Restricted
              </Typography>
            }
          />
          <CardContent>
            <Typography color="text.secondary">
              Only wallet owners can manage owner settings and modify wallet permissions.
            </Typography>
            <Alert severity="warning" icon={<WarningAmberIcon />}>
              Owner privileges required. <br />
              <Typography variant="caption">Your current status: <b>Non-Owner</b></Typography>
            </Alert>
          </CardContent>
        </Paper>
      </Box>
    );
  }

  const stats = [
    {
      icon: <GroupIcon color="info" />,
      label: "Total Owners",
      value: owners?.length || 0,
      color: "info.main",
    },
    {
      icon: <SecurityIcon color="success" />,
      label: "Required Signatures",
      value: required?.toString() || 0,
      color: "success.main",
    },
    {
      icon: <SettingsIcon color="secondary" />,
      label: "Security Ratio",
      value: owners?.length && required ? `${Math.round((Number(required) / owners.length) * 100)}%` : "0%",
      color: "secondary.main",
    },
    {
      icon: <EmojiEventsIcon color="warning" />,
      label: "Security Level",
      value: securityLevel,
      color: securityColor,
    },
  ];

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={2} mb={2}>
        {stats.map((stat, idx) => (
          <Grid item xs={12} md={3} key={stat.label}>
            <Paper elevation={6} sx={{
              bgcolor: "rgba(30,41,59,0.97)",
              borderRadius: 4,
              boxShadow: "0 8px 30px rgba(60,60,100,0.13)"
            }}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {stat.icon}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">{stat.label}</Typography>
                  <Typography variant="h6" color={stat.color}>{stat.value}</Typography>
                </Box>
              </CardContent>
            </Paper>
          </Grid>
        ))}
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
          {tabs.map((tab, idx) => (
            <Tab key={tab.label} label={tab.label} icon={tab.icon} iconPosition="start" sx={{ fontWeight: "bold" }} />
          ))}
        </Tabs>

        <CardContent>
          {/* Owners Tab */}
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">Current Owners</Typography>
                  <Typography variant="body2" color="text.secondary">Manage wallet ownership and permissions</Typography>
                </Box>
                <Box sx={{ bgcolor: "grey.100", borderRadius: 2, px: 2, py: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {owners?.length || 0} owner{(owners?.length || 0) !== 1 ? "s" : ""} • {required?.toString() || 0} required
                  </Typography>
                </Box>
              </Box>
              <Box>
                {owners?.map((owner, idx) => (
                  <Paper key={owner} elevation={4} sx={{
                    bgcolor: "rgba(30,41,59,0.96)",
                    borderRadius: 3,
                    mb: 2,
                    boxShadow: "0 4px 15px rgba(60,60,100,0.09)"
                  }}>
                    <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box sx={{
                          width: 48, height: 48, bgcolor: "info.main", color: "#fff", borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 20
                        }}>
                          {idx + 1}
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                            {owner}
                            {owner.toLowerCase() === address?.toLowerCase() && (
                              <Button size="small" variant="outlined" startIcon={<PersonIcon color="success" />} sx={{ ml: 1 }}>
                                You
                              </Button>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Owner #{idx + 1} • Full wallet privileges
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          color="info"
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setActiveTab(3);
                            setOwnerToReplace(owner);
                          }}
                        >
                          Replace
                        </Button>
                        <Button
                          color="error"
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setActiveTab(2);
                            setOwnerToRemove(owner);
                          }}
                        >
                          Remove
                        </Button>
                      </Box>
                    </CardContent>
                  </Paper>
                ))}
                {owners.length === 0 && (
                  <Alert severity="info" icon={<GroupIcon />}>
                    No owners found. This shouldn't happen in a properly configured multisig wallet.
                  </Alert>
                )}
              </Box>
            </Box>
          )}

         
          {activeTab === 1 && (
            <Box component="form" onSubmit={handleAddOwner} sx={{ maxWidth: 400 }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main">Add New Owner</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>Grant wallet access to a new address</Typography>
              <TextField
                label="Owner Address"
                variant="outlined"
                fullWidth
                required
                value={newOwner}
                onChange={e => setNewOwner(e.target.value)}
                margin="normal"
                placeholder="0x..."
              />
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="body2"><b>Before adding a new owner:</b></Typography>
                <ul>
                  <li>Verify the address is correct and controlled by a trusted party</li>
                  <li>Consider if the current signature requirement needs adjustment</li>
                  <li>New owner will immediately have full wallet privileges</li>
                </ul>
              </Alert>
              <Button
                type="submit"
                variant="contained"
                color="info"
                startIcon={isPending || isConfirming ? <CircularProgress color="inherit" size={20} /> : <AddIcon />}
                disabled={isPending || isConfirming}
                fullWidth
                sx={{ mt: 2 }}
              >
                {isPending || isConfirming ? "Adding Owner..." : "Add Owner"}
              </Button>
            </Box>
          )}

         
          {activeTab === 2 && (
            <Box component="form" onSubmit={handleRemoveOwner} sx={{ maxWidth: 400 }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main">Remove Owner</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>Revoke wallet access from an existing owner</Typography>
              <Select
                label="Owner to Remove"
                fullWidth
                required
                value={ownerToRemove}
                onChange={e => setOwnerToRemove(e.target.value)}
                displayEmpty
                sx={{ mb: 2 }}
              >
                <MenuItem value="">Select owner to remove...</MenuItem>
                {owners?.map(owner => (
                  <MenuItem key={owner} value={owner}>{owner} {owner.toLowerCase() === address?.toLowerCase() ? "(You)" : ""}</MenuItem>
                ))}
              </Select>
              <Alert severity="warning" icon={<WarningAmberIcon />}>
                <b>Warning:</b>
                <ul>
                  <li>Removing an owner is irreversible</li>
                  <li>Ensure remaining owners can still meet the signature requirement</li>
                  <li>
                    Current requirement: {required?.toString()}, owners after removal: {(owners?.length || 1) - 1}
                  </li>
                </ul>
              </Alert>
              <Button
                type="submit"
                variant="contained"
                color="error"
                startIcon={isPending || isConfirming ? <CircularProgress color="inherit" size={20} /> : <RemoveIcon />}
                disabled={isPending || isConfirming || !ownerToRemove}
                fullWidth
                sx={{ mt: 2 }}
              >
                {isPending || isConfirming ? "Removing Owner..." : "Remove Owner"}
              </Button>
            </Box>
          )}

        
          {activeTab === 3 && (
            <Box component="form" onSubmit={handleReplaceOwner} sx={{ maxWidth: 400 }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main">Replace Owner</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>Replace an existing owner with a new address</Typography>
              <Select
                label="Owner to Replace"
                fullWidth
                required
                value={ownerToReplace}
                onChange={e => setOwnerToReplace(e.target.value)}
                displayEmpty
                sx={{ mb: 2 }}
              >
                <MenuItem value="">Select owner to replace...</MenuItem>
                {owners?.map(owner => (
                  <MenuItem key={owner} value={owner}>{owner} {owner.toLowerCase() === address?.toLowerCase() ? "(You)" : ""}</MenuItem>
                ))}
              </Select>
              <TextField
                label="New Owner Address"
                variant="outlined"
                fullWidth
                required
                value={replacementOwner}
                onChange={e => setReplacementOwner(e.target.value)}
                margin="normal"
                placeholder="0x..."
              />
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="body2"><b>Replacement Process:</b></Typography>
                <ul>
                  <li>Old owner will be removed immediately</li>
                  <li>New owner will gain full privileges</li>
                  <li>Total owner count remains the same</li>
                  <li>Signature requirement stays unchanged</li>
                </ul>
              </Alert>
              <Button
                type="submit"
                variant="contained"
                color="info"
                startIcon={isPending || isConfirming ? <CircularProgress color="inherit" size={20} /> : <SwapHorizIcon />}
                disabled={isPending || isConfirming || !ownerToReplace || !replacementOwner}
                fullWidth
                sx={{ mt: 2 }}
              >
                {isPending || isConfirming ? "Replacing Owner..." : "Replace Owner"}
              </Button>
            </Box>
          )}

         
          {activeTab === 4 && (
            <Box component="form" onSubmit={handleChangeRequirement} sx={{ maxWidth: 400 }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main">Change Signature Requirement</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>Adjust the number of signatures required for wallet operations</Typography>
              <TextField
                label="Required Signatures"
                variant="outlined"
                type="number"
                inputProps={{ min: 1, max: owners?.length || 1 }}
                fullWidth
                required
                value={newRequirement}
                onChange={e => setNewRequirement(e.target.value)}
                margin="normal"
              />
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Current: {required?.toString()} signatures required<br />
                  Maximum: {owners?.length || 0} (total owners)<br />
                  Minimum: 1 signature
                </Typography>
              </Box>
              <Alert severity="success" icon={<InfoIcon />}>
                <b>Security Guidelines:</b>
                <ul>
                  <li>Low Security (1-33%): Fast operations, higher risk</li>
                  <li>Medium Security (34-49%): Balanced approach</li>
                  <li>High Security (50-74%): Strong protection, slower operations</li>
                  <li>Very High Security (75%+): Maximum security, requires most owners</li>
                </ul>
              </Alert>
              {newRequirement && (
                <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
                  <b>Preview:</b>
                  <div>
                    New requirement: {newRequirement}/{owners?.length || 0} signatures<br />
                    Security ratio: {owners?.length ? Math.round((Number.parseInt(newRequirement) / owners.length) * 100) : 0}%<br />
                    Security level: {
                      (() => {
                        if (!owners?.length || !newRequirement) return "Unknown";
                        const ratio = Number.parseInt(newRequirement) / owners.length;
                        if (ratio >= 0.75) return "Very High";
                        if (ratio >= 0.5) return "High";
                        if (ratio >= 0.33) return "Medium";
                        return "Low";
                      })()
                    }
                  </div>
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                color="info"
                startIcon={isPending || isConfirming ? <CircularProgress color="inherit" size={20} /> : <SettingsIcon />}
                disabled={isPending || isConfirming || !newRequirement}
                fullWidth
                sx={{ mt: 2 }}
              >
                {isPending || isConfirming ? "Updating Requirement..." : "Update Requirement"}
              </Button>
            </Box>
          )}

         
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} icon={<ErrorIcon />}>
              <b>Operation Failed:</b> {error.shortMessage || error.message}
            </Alert>
          )}
          {isSuccess && (
            <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircleIcon />}>
              Operation Successful! Owner management operation completed.
            </Alert>
          )}
        </CardContent>
      </Paper>
    </Box>
  );
};

export default OwnerManagement;