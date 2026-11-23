import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Avatar, Badge, Box, Breadcrumbs, Button, Divider, Drawer, IconButton, InputBase, List, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import KingBedRoundedIcon from '@mui/icons-material/KingBedRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import SellRoundedIcon from '@mui/icons-material/SellRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import Brand from '../components/common/Brand';
import { signOutPartner } from '../redux/slices/authSlice';
import { getProperties } from '../services/partnerApi';

const expandedWidth = 260;
const items = [
  ['Dashboard', '/partner/dashboard', <DashboardRoundedIcon />],
  ['My Property', '/partner/properties', <ApartmentRoundedIcon />],
  ['Hotel Gallery', '/partner/gallery', <PhotoLibraryRoundedIcon />],
  ['Room Setup', '/partner/rooms', <KingBedRoundedIcon />],
  ['Bookings', '/partner/bookings', <EventAvailableRoundedIcon />],
  ['Room Availability', '/partner/availability', <SellRoundedIcon />],
  ['Payments & Earnings', '/partner/payments', <AccountBalanceWalletRoundedIcon />],
  ['Verification Status', '/partner/verification', <VerifiedUserRoundedIcon />],
  ['Reviews', '/partner/reviews', <StarRoundedIcon />],
  ['Settings', '/partner/settings', <SettingsRoundedIcon />],
  ['Help & Support', '/partner/help', <HelpOutlineRoundedIcon />],
];

function PartnerLayout({ children }) {
  const theme = useTheme(); const mobile = useMediaQuery(theme.breakpoints.down('md')); const [drawerOpen, setDrawerOpen] = useState(false); const [collapsed, setCollapsed] = useState(false); const [menuAnchor, setMenuAnchor] = useState(null); const [property, setProperty] = useState(null); const location = useLocation(); const navigate = useNavigate(); const dispatch = useDispatch();
  const partner = useSelector((state) => state.auth.partner); const status = property?.status === 'Approved' ? 'approved' : 'pending'; const activeItem = items.find((item) => item[1] === location.pathname); const pageTitle = activeItem?.[0] || 'Dashboard'; const drawerWidth = collapsed ? 82 : expandedWidth;
  useEffect(() => { getProperties().then((properties) => setProperty(properties[0] || null)).catch(() => setProperty(null)); }, []);
  function logout() { dispatch(signOutPartner()).finally(() => navigate('/partner/login', { replace: true })); }
  const navList = <Box sx={{ width: mobile ? expandedWidth : drawerWidth, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#172D50', color: '#fff', transition: 'width .2s' }}>
    <Toolbar sx={{ px: collapsed && !mobile ? 2 : 2.5, minHeight: '78px !important', justifyContent: collapsed && !mobile ? 'center' : 'flex-start' }}><Brand light compact={collapsed && !mobile} /></Toolbar>
    {property && (!collapsed || mobile) && <Box sx={{ px: 2, py: 1.4, mx: 1.5, mb: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,.08)' }}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,.6)' }}>ACTIVE PROPERTY</Typography><Typography fontWeight={800} noWrap>{property.business?.name || 'Your property'}</Typography><Typography variant="caption" sx={{ color: status === 'approved' ? '#65D4A4' : '#FFC46B' }}>● {status === 'approved' ? 'Approved and live' : 'Application under review'}</Typography></Box>}
    <Divider sx={{ borderColor: 'rgba(255,255,255,.12)' }} />
    <List sx={{ flex: 1, px: 1.25, py: 1.5, overflowY: 'auto' }}>{items.map(([label, path, icon]) => <ListItemButton key={path} component={RouterLink} to={path} selected={location.pathname === path} title={collapsed && !mobile ? label : undefined} onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2, mb: .45, minHeight: 45, color: 'rgba(255,255,255,.77)', justifyContent: collapsed && !mobile ? 'center' : 'flex-start', '& .MuiListItemIcon-root': { minWidth: collapsed && !mobile ? 0 : 40, color: 'inherit' }, '&.Mui-selected': { bgcolor: '#7655D9', color: '#fff', '&:hover': { bgcolor: '#6746CD' } }, '&:hover': { bgcolor: 'rgba(255,255,255,.09)' } }}><ListItemIcon>{icon}</ListItemIcon>{(!collapsed || mobile) && <ListItemText primary={label} primaryTypographyProps={{ fontSize: 13, fontWeight: location.pathname === path ? 700 : 500 }} />}</ListItemButton>)}</List>
    <Divider sx={{ borderColor: 'rgba(255,255,255,.12)' }} />
    {(!collapsed || mobile) && <Box sx={{ p: 1.8, display: 'flex', alignItems: 'center', gap: 1.2 }}><Avatar sx={{ width: 36, height: 36, bgcolor: '#7655D9', fontSize: 14 }}>{partner?.fullName?.[0] || 'P'}</Avatar><Box sx={{ minWidth: 0, flex: 1 }}><Typography variant="body2" fontWeight={700} noWrap>{partner?.fullName || 'Partner profile'}</Typography><Typography variant="caption" sx={{ color: 'rgba(255,255,255,.58)' }}>Property partner</Typography></Box></Box>}
    <List sx={{ px: 1.25, pt: 0, pb: 1.25 }}><ListItemButton onClick={logout} title={collapsed && !mobile ? 'Sign out' : undefined} sx={{ borderRadius: 2, color: 'rgba(255,255,255,.74)', justifyContent: collapsed && !mobile ? 'center' : 'flex-start', '& .MuiListItemIcon-root': { minWidth: collapsed && !mobile ? 0 : 40, color: 'inherit' }, '&:hover': { bgcolor: 'rgba(255,255,255,.09)' } }}><ListItemIcon><LogoutRoundedIcon /></ListItemIcon>{(!collapsed || mobile) && <ListItemText primary="Sign out" />}</ListItemButton></List>
  </Box>;
  return <Box sx={{ minHeight: '100vh', bgcolor: '#F7F8FC' }}>
    {mobile ? <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: expandedWidth, bgcolor: '#172D50', color: '#fff' } }}>{navList}</Drawer> : <Drawer variant="permanent" PaperProps={{ sx: { width: drawerWidth, boxSizing: 'border-box', bgcolor: '#172D50', color: '#fff', border: 0, transition: 'width .2s', overflowX: 'hidden' } }}>{navList}<IconButton onClick={() => setCollapsed((value) => !value)} sx={{ position: 'absolute', top: 27, right: collapsed ? 5 : 8, color: 'rgba(255,255,255,.7)', width: 26, height: 26 }}>{collapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}</IconButton></Drawer>}
    <Box sx={{ ml: { md: `${drawerWidth}px` }, transition: 'margin .2s' }}>
      <Box sx={{ minHeight: 78, px: { xs: 1.5, md: 3.5 }, bgcolor: '#fff', borderBottom: '1px solid #E9EDF3', display: 'flex', alignItems: 'center', gap: 1.5, position: 'sticky', top: 0, zIndex: 3 }}>
        {mobile && <IconButton onClick={() => setDrawerOpen(true)}><MenuRoundedIcon /></IconButton>}
        <Box sx={{ minWidth: 120, mr: 'auto' }}><Typography fontWeight={800}>{pageTitle}</Typography><Breadcrumbs sx={{ '& .MuiBreadcrumbs-separator': { mx: .5 } }}><Typography variant="caption" color="text.secondary">Roomly Partner</Typography><Typography variant="caption" color="text.secondary">{pageTitle}</Typography></Breadcrumbs></Box>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', px: 1.2, py: .45, width: { sm: 170, lg: 240 }, borderRadius: 2, bgcolor: '#F6F7FA' }}><SearchRoundedIcon fontSize="small" color="action" /><InputBase placeholder="Search..." sx={{ ml: 1, fontSize: 13, width: '100%' }} /></Box>
        <IconButton aria-label="Notifications" onClick={() => navigate('/partner/verification')}><Badge variant="dot" color="warning"><NotificationsNoneRoundedIcon /></Badge></IconButton>
        <Button onClick={(event) => setMenuAnchor(event.currentTarget)} sx={{ minWidth: 0, px: .5, color: 'text.primary' }}><Avatar sx={{ width: 34, height: 34, bgcolor: '#EEE9FC', color: 'secondary.main', fontSize: 14, fontWeight: 800 }}>{partner?.fullName?.[0] || 'P'}</Avatar><Box sx={{ textAlign: 'left', mx: 1, display: { xs: 'none', md: 'block' } }}><Typography variant="body2" fontWeight={700}>{partner?.fullName || 'Partner'}</Typography><Typography variant="caption" color="text.secondary">Partner account</Typography></Box><KeyboardArrowDownRoundedIcon sx={{ display: { xs: 'none', md: 'block' } }} /></Button>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}><MenuItem onClick={() => { setMenuAnchor(null); navigate('/partner/settings'); }}>Profile & settings</MenuItem><MenuItem onClick={logout}>Sign out</MenuItem></Menu>
      </Box>
      <Box sx={{ maxWidth: 1540, mx: 'auto', p: { xs: 2, md: 3.5 } }}>{children}</Box>
    </Box>
  </Box>;
}
export default PartnerLayout;
