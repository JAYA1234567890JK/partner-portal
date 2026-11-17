import { Box, Button, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import Brand from '../../components/common/Brand';
function DashboardPlaceholder() { return <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 2, md: 5 } }}><Brand /><Paper sx={{ maxWidth: 680, mx: 'auto', mt: { xs: 8, md: 14 }, p: { xs: 4, md: 7 }, textAlign: 'center' }}><Typography className="eyebrow">PARTNER PORTAL</Typography><Typography variant="h4" sx={{ mt: 1.5 }}>You’re signed in</Typography><Typography color="text.secondary" sx={{ mt: 1.5, mb: 3 }}>Your partner dashboard will be available in a future release.</Typography><Button component={Link} to="/partner/login" variant="outlined">Return to login</Button></Paper></Box>; }
export default DashboardPlaceholder;

