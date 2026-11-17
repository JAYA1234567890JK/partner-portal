import { useState } from 'react';
import { Alert, Box, Button, Checkbox, FormControlLabel, Link, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AuthLayout from '../../layouts/AuthLayout';
import PasswordField from '../../components/common/PasswordField';
import { authenticatePartner } from '../../services/authService';
import { getPartnerStatus } from '../../services/partnerData';

function Login() {
  const navigate = useNavigate(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [remember, setRemember] = useState(true); const [error, setError] = useState('');
  function handleSubmit(event) { event.preventDefault(); if (authenticatePartner(email, password)) { setError(''); const status = getPartnerStatus(); navigate(status === 'onboarding' ? '/partner/onboarding' : '/partner/dashboard'); } else setError('Those details don’t match our records. Please try again.'); }
  return <AuthLayout><Box className="auth-heading"><Typography className="eyebrow">PARTNER PORTAL</Typography><Typography variant="h4" sx={{ mt: 1.1 }}>Partner Login</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Log in to manage your properties and bookings.</Typography></Box>
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3.5 }}><Stack spacing={2.25}>{error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}<TextField label="Email address" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required fullWidth /><PasswordField label="Password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: -.5 }}><FormControlLabel control={<Checkbox checked={remember} onChange={(event) => setRemember(event.target.checked)} size="small" />} label={<Typography variant="body2" color="text.secondary">Remember me</Typography>} sx={{ ml: -.75 }} /><Link component={RouterLink} to="/partner/forgot-password" underline="hover" variant="body2" fontWeight={700}>Forgot password?</Link></Box><Button type="submit" variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />} fullWidth sx={{ mt: .5, minHeight: 52 }}>Log in to your account</Button></Stack></Box>
    <Box className="auth-switch"><Typography color="text.secondary" variant="body2">New to Roomly?</Typography><Link component={RouterLink} to="/partner/register" underline="hover" fontWeight={700}>Create a partner account</Link></Box><Typography className="demo-hint" variant="caption">Demo access: partner@example.com · Partner@123</Typography>
  </AuthLayout>;
}
export default Login;
