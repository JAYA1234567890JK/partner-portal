import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Box, Button, Checkbox, FormControlLabel, Link, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AuthLayout from '../../layouts/AuthLayout';
import PasswordField from '../../components/common/PasswordField';
import { signInPartner, setError } from '../../redux/slices/authSlice';
import { getOnboardingDraft, getProperties } from '../../services/partnerApi';

function Login() {
  const navigate = useNavigate(); const location = useLocation(); const dispatch = useDispatch(); const { isLoading, error } = useSelector((state) => state.auth); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [remember, setRemember] = useState(true);
  useEffect(() => { dispatch(setError(null)); }, [dispatch]);
  async function handleSubmit(event) { event.preventDefault(); try { await dispatch(signInPartner({ email, password })).unwrap(); const [draft, properties] = await Promise.all([getOnboardingDraft().catch(() => null), getProperties().catch(() => [])]); const destination = draft || !properties.length ? '/partner/onboarding' : '/partner/dashboard'; navigate(location.state?.from?.pathname && location.state.from.pathname !== '/partner/login' ? location.state.from.pathname : destination, { replace: true }); } catch (_) {} }
  return <AuthLayout><Box className="auth-heading"><Typography className="eyebrow">PARTNER PORTAL</Typography><Typography variant="h4" sx={{ mt: 1.1 }}>Partner Login</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Log in to manage your properties and bookings.</Typography></Box>
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3.5 }}><Stack spacing={2.25}>{error && <Alert severity="error" onClose={() => dispatch(setError(null))}>{error}</Alert>}<TextField label="Email address" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); dispatch(setError(null)); }} required fullWidth /><PasswordField label="Password" autoComplete="current-password" value={password} onChange={(event) => { setPassword(event.target.value); dispatch(setError(null)); }} required /><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: -.5 }}><FormControlLabel control={<Checkbox checked={remember} onChange={(event) => setRemember(event.target.checked)} size="small" />} label={<Typography variant="body2" color="text.secondary">Remember me</Typography>} sx={{ ml: -.75 }} /><Link component={RouterLink} to="/partner/forgot-password" underline="hover" variant="body2" fontWeight={700}>Forgot password?</Link></Box><Button type="submit" variant="contained" size="large" endIcon={<ArrowForwardRoundedIcon />} fullWidth disabled={isLoading} sx={{ mt: .5, minHeight: 52 }}>{isLoading ? 'Signing in…' : 'Log in to your account'}</Button></Stack></Box>
    <Box className="auth-switch"><Typography color="text.secondary" variant="body2">New to Roomly?</Typography><Link component={RouterLink} to="/partner/register" underline="hover" fontWeight={700}>Create a partner account</Link></Box>
  </AuthLayout>;
}
export default Login;
