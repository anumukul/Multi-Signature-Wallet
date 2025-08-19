import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import WalletInfo from "./WalletInfo";
import TransactionList from "./TransactionList";
import SubmitTransaction from "./SubmitTransaction";
import OwnerManagement from "./OwnerManagement";
import Settings from "./Settings";


import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import WalletIcon from "@mui/icons-material/AccountBalanceWallet";
import GroupIcon from "@mui/icons-material/Group";
import SendIcon from "@mui/icons-material/Send";
import SettingsIcon from "@mui/icons-material/Settings";
import ShieldIcon from "@mui/icons-material/Security";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import Fade from "@mui/material/Fade";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";

const Dashboard = () => {
  const { isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState(0);


  const tabs = [
    { label: "Transactions", icon: <SendIcon /> },
    { label: "Owners", icon: <GroupIcon /> },
    { label: "Settings", icon: <SettingsIcon /> },
  ];

  
  if (!isConnected) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Fade in>
          <Paper
            elevation={10}
            sx={{
              p: { xs: 4, sm: 6 },
              maxWidth: 430,
              mx: "auto",
              borderRadius: 5,
              textAlign: "center",
              background: "linear-gradient(135deg, #232a36 70%, #1e293b 100%)",
              boxShadow: "0 10px 40px rgba(60,60,100,0.25)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
              <WalletIcon sx={{
                fontSize: 50,
                color: "primary.main",
                background: "linear-gradient(135deg,#dc2626,#f59e0b)",
                borderRadius: "50%",
                p: 2,
                boxShadow: 4,
              }} />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
              <SparklesIcon sx={{ fontSize: 22, color: "secondary.main" }} />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  letterSpacing: "1px",
                  background: "linear-gradient(90deg,#dc2626,#f59e0b)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                MultiSig Vault
              </Typography>
              <SparklesIcon sx={{ fontSize: 22, color: "secondary.main" }} />
            </Box>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Secure multi-signature wallet management<br />
              <span style={{ opacity: 0.85 }}>
                with enterprise-grade protection
              </span>
            </Typography>
            <Box sx={{ mt: 2, mb: 2 }}>
              <ConnectButton />
            </Box>
            <Divider sx={{ my: 2, bgcolor: "background.paper" }} />
            <Box sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              bgcolor: "rgba(30,41,59,0.92)",
              borderRadius: 2,
              p: 1.5,
              boxShadow: 2,
            }}>
              <ShieldIcon sx={{ fontSize: 20, color: "primary.main" }} />
              <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                Protected by blockchain cryptography
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Box>
    );
  }

 
  return (
    <Box sx={{ minHeight: "100vh", background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" }}>
      <AppBar
        position="sticky"
        elevation={8}
        sx={{
          bgcolor: "rgba(30,41,59,0.97)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(60,60,100,0.15)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <WalletIcon sx={{
              fontSize: 38,
              color: "primary.main",
              background: "linear-gradient(135deg,#dc2626,#f59e0b)",
              borderRadius: 2,
              p: 1,
              boxShadow: 2,
            }} />
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    background: "linear-gradient(90deg,#dc2626,#f59e0b)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  MultiSig Vault
                </Typography>
                <SparklesIcon sx={{ fontSize: 20, color: "secondary.main" }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Enterprise multi-signature security
              </Typography>
            </Box>
          </Box>
          <ConnectButton />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, md: 3 } }}>
        <WalletInfo />

        <Paper
          elevation={4}
          sx={{
            bgcolor: "rgba(30,41,59,0.97)",
            borderRadius: 4,
            boxShadow: "0 8px 30px rgba(60,60,100,0.20)",
            mt: 4,
            overflow: "hidden",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            TabIndicatorProps={{ style: { background: "linear-gradient(90deg,#dc2626,#f59e0b)" } }}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              background: "linear-gradient(90deg,#1e293b 80%,#232a36 100%)",
              "& .Mui-selected": {
                color: "primary.main",
                fontWeight: "bold",
              },
            }}
          >
            {tabs.map((tab, idx) => (
              <Tab
                key={tab.label}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                sx={{
                  fontWeight: "bold",
                  fontSize: 16,
                  color: "text.secondary",
                  "&.Mui-selected": {
                    color: "primary.main",
                    background: "linear-gradient(90deg,#232a36,#1e293b)",
                  },
                }}
              />
            ))}
          </Tabs>
          <Box sx={{ p: { xs: 1.5, md: 3 }, background: "linear-gradient(90deg, #232a36 80%, #1e293b 100%)" }}>
            {activeTab === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <TransactionList />
                </Grid>
                <Grid item xs={12} md={4}>
                  <SubmitTransaction />
                </Grid>
              </Grid>
            )}
            {activeTab === 1 && <OwnerManagement />}
            {activeTab === 2 && <Settings />}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard;