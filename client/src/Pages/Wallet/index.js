import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, Stack, Divider, Chip, Alert } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import api, { errorMessage } from '../../api';

export default function Wallet() {
    const [balance, setBalance] = useState(0);
    const [txns, setTxns] = useState([]);
    const [err, setErr] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/wallet');
                setBalance(data.balance || 0);
                setTxns(data.transactions || []);
            } catch (e) {
                setErr(errorMessage(e));
            }
        })();
    }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Wallet</Typography>
            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            <Paper sx={{ p: 4, mb: 3, background: 'linear-gradient(135deg,#2e7d32,#66bb6a)', color: 'white' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <AccountBalanceWalletIcon fontSize="large" />
                    <Box>
                        <Typography variant="overline">Available balance</Typography>
                        <Typography variant="h3" fontWeight={800}>₹{balance.toFixed(2)}</Typography>
                    </Box>
                </Stack>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.85 }}>
                    Earn 2% cashback on every delivered order. Apply your balance at checkout.
                </Typography>
            </Paper>

            <Typography variant="h6" gutterBottom>Transactions</Typography>
            <Paper>
                {txns.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">No transactions yet.</Typography>
                    </Box>
                )}
                {txns.map((t, i) => (
                    <Box key={i}>
                        <Stack direction="row" justifyContent="space-between" sx={{ p: 2 }}>
                            <Box>
                                <Typography variant="body2" fontWeight={600}>{t.reason}</Typography>
                                <Typography variant="caption" color="text.secondary">{new Date(t.at).toLocaleString()}</Typography>
                            </Box>
                            <Chip
                                label={`${t.type === 'credit' ? '+' : '−'}₹${t.amount.toFixed(2)}`}
                                color={t.type === 'credit' ? 'success' : 'default'}
                            />
                        </Stack>
                        {i < txns.length - 1 && <Divider />}
                    </Box>
                ))}
            </Paper>
        </Container>
    );
}
