import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MULTISIG_CONTRACT_ADDRESS, MULTISIG_ABI } from "../contracts/MultiSigWallet";
import { parseEther } from "viem";

// MUI imports
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";

// MUI Icons
import SendIcon from "@mui/icons-material/Send";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const SubmitTransaction = () => {
  const [destination, setDestination] = useState("");
  const [value, setValue] = useState("");
  const [data, setData] = useState("0x");

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const valueWei = value ? parseEther(value.toString()) : 0n;
      writeContract({
        address: MULTISIG_CONTRACT_ADDRESS,
        abi: MULTISIG_ABI,
        functionName: "submitTransaction",
        args: [destination, valueWei, data || "0x"],
      });
    } catch (err) {
      console.error("Error submitting transaction:", err);
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: "0 8px 30px rgba(60,60,100,0.13)",
        bgcolor: "rgba(30,41,59,0.97)",
        p: 2,
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <SendIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                New Transaction
              </Typography>
              <AutoAwesomeIcon color="secondary" />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Submit a transaction for multi-sig approval
            </Typography>
          </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Destination Address"
                variant="outlined"
                fullWidth
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                margin="normal"
                placeholder="0x..."
                InputProps={{ style: { fontFamily: "monospace" } }}
                helperText="Enter the recipient's Ethereum address"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Value (ETH)"
                variant="outlined"
                fullWidth
                type="number"
                step="0.001"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                margin="normal"
                placeholder="0.0"
                helperText="Amount of ETH to transfer"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Transaction Data (Optional)"
                variant="outlined"
                fullWidth
                multiline
                rows={4}
                value={data}
                onChange={(e) => setData(e.target.value)}
                margin="normal"
                placeholder="0x"
                InputProps={{ style: { fontFamily: "monospace" } }}
                helperText="Smart contract call data (leave as 0x for simple transfers)"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                disabled={isPending || isConfirming || !destination}
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                startIcon={isPending || isConfirming ? <CircularProgress color="inherit" size={22} /> : <AddCircleIcon />}
                endIcon={<ArrowForwardIcon />}
                sx={{ py: 2, fontWeight: "bold" }}
              >
                {isPending || isConfirming ? "Submitting Transaction..." : "Submit Transaction"}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {error && (
          <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Transaction Failed
            </Typography>
            <Typography variant="body2">
              {error.shortMessage || error.message}
            </Typography>
          </Alert>
        )}

        {isSuccess && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              Transaction Submitted Successfully
            </Typography>
            <Typography variant="body2">
              Your transaction has been submitted to the vault and is now awaiting the required confirmations from other owners.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SubmitTransaction;