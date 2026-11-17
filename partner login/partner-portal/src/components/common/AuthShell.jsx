import { Box, Chip, Typography } from '@mui/material';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import Brand from './Brand';

const hotelImage = 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1800&q=85';
function AuthShell({ children }) {
  return <Box className="auth-shell"><Box className="auth-visual" sx={{ backgroundImage: `linear-gradient(180deg, rgba(14,29,53,.12) 4%, rgba(14,29,53,.18) 40%, rgba(14,29,53,.85) 100%), url("${hotelImage}")` }}><Box className="visual-top"><Brand light /></Box><Box className="visual-content"><Chip icon={<VerifiedRoundedIcon />} label="A better way to host" sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,.13)', border: '1px solid rgba(255,255,255,.2)', '& .MuiChip-icon': { color: '#C9B8FF' } }} /><Typography variant="h2" sx={{ color: '#fff', mt: 2.5, maxWidth: 520 }}>Welcome Back,<br />Partner!</Typography><Typography sx={{ color: 'rgba(255,255,255,.78)', mt: 2, maxWidth: 460, fontSize: 17, lineHeight: 1.7 }}>Manage your properties, rooms and hourly bookings from one place.</Typography><Box className="visual-footer"><Box className="avatar-stack"><span>R</span><span>A</span><span>M</span></Box><Typography sx={{ color: 'rgba(255,255,255,.83)', fontSize: 13 }}>Your property. Your bookings. Your business.</Typography></Box></Box></Box><Box className="auth-main"><Box className="mobile-brand"><Brand /></Box><Box className="auth-card">{children}</Box><Typography className="auth-footer" variant="caption">© {new Date().getFullYear()} Stayhour · Partner Portal</Typography></Box></Box>;
}
export default AuthShell;
