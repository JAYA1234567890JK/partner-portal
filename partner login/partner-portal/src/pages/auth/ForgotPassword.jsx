import { useState } from 'react';
import { Alert, Box, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AuthLayout from '../../layouts/AuthLayout';
function ForgotPassword() {
  const [email, setEmail] = useState(''); const [sent, setSent] = useState(false);
  function submit(event) { event.preventDefault(); setSent(true); }
  return <AuthLayout><Box className="auth-heading"><Typography className="eyebrow">ACCOUNT RECOVERY</Typography><Typography variant="h4" sx={{ mt: 1.1 }}>Forgot your password?</Typography><Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>Enter the email address linked to your partner account and we’ll send reset instructions.</Typography></Box><Box component="form" onSubmit={submit} sx={{ mt: 3.5 }}><Stack spacing={2.25}>{sent && <Alert severity="success">If an account exists for {email}, reset instructions are on their way.</Alert>}<TextField label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required fullWidth autoComplete="email"/><Button type="submit" variant="contained" size="large" fullWidth sx={{ minHeight: 52 }}>Send reset link</Button></Stack></Box><Box className="auth-switch"><Link component={RouterLink} to="/partner/login" underline="hover" fontWeight={700} sx={{ display: 'inline-flex', alignItems: 'center', gap: .75 }}><ArrowBackRoundedIcon fontSize="small" />Back to login</Link></Box></AuthLayout>;
}
export default ForgotPassword;
