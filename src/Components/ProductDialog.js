import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import { Divider, Chip, Rating } from "@mui/material";
import QuantityBox from './QuantityBox';

export default function ProductDialog({ open, onClose, fruit }) {
    const handleQuantityChange = (val) => {
        console.log("Quantity updated to:", val);
    };
    if (!fruit) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">{fruit.name}</Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton> 
            </DialogTitle>

            <DialogContent dividers>
                <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={4}>

                    <Box flexShrink={0} width={{ xs: "100%", md: 250 }} textAlign="center">
                        <img
                            src={fruit.img}
                            alt={fruit.name}
                            style={{ width: "100%", borderRadius: 8 }}
                        />
                        <Box mt={1}>
                            <Chip label="25% OFF" color="primary" size="small" />
                            <Chip label="RECOMMENDED" size="small" sx={{ ml: 1 }} />
                        </Box>
                    </Box>


                    <Box flexGrow={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Brand: Welch's
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Rating value={4} readOnly size="small" />
                            <Typography variant="body2">(1 Review)</Typography>
                        </Box>

                        <Box mt={1} display="flex" alignItems="center" gap={2}>
                            <Typography variant="body2" sx={{ textDecoration: "line-through", color: "gray" }}>
                                100 Ruppes
                            </Typography>
                            <Typography variant="h6" color="primary">
                                75 Ruppes (per Kg)
                            </Typography>
                            <Chip label="In Stock" color="success" size="small" />
                        </Box>

                        <Typography variant="body2" mt={2}>
                            {fruit.description || "Vivamus adipiscing nisl ut dolor dignissim semper. Nulla luctus malesuada tincidunt."}
                        </Typography>


                        <Box display="flex" alignItems="center" mt={2} gap={1}>
                            <QuantityBox onChange={handleQuantityChange} />
                            <Button variant="contained" color="primary" sx={{ ml: 2 }}>
                                Add to cart
                            </Button>
                        </Box>


                        <Divider sx={{ my: 2 }} />

                        <Box>
                            <Typography variant="body2">✓ Type: Organic</Typography>
                            <Typography variant="body2">✓ MFG: Jun 4, 2021</Typography>
                            <Typography variant="body2">✓ LIFE: 30 days</Typography>
                        </Box>

                        <Box mt={2}>
                            <Typography variant="caption" color="text.secondary">
                                Category: Meats & Seafood
                            </Typography>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                                Tags: chicken, natural, organic
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
}
