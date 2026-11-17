import { Box, Typography } from '@mui/material';
import HotelRoundedIcon from '@mui/icons-material/HotelRounded';

function Brand({ light = false, compact = false }) {
  return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}><Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: light ? 'rgba(255,255,255,.14)' : 'primary.main', color: '#fff' }}><HotelRoundedIcon /></Box>{!compact && <Box><Typography sx={{ fontWeight: 800, color: light ? '#fff' : 'primary.main', lineHeight: 1.15, letterSpacing: '-.02em' }}>roomly</Typography><Typography sx={{ color: light ? 'rgba(255,255,255,.66)' : 'text.secondary', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase' }}>Partner Portal</Typography></Box>}</Box>;
}
export default Brand;
