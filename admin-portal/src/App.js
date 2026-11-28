import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  Alert, AppBar, Avatar, Box, Button, Chip, CircularProgress, CssBaseline,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, Drawer, IconButton,
  List, ListItemButton, ListItemIcon, ListItemText, Paper, Snackbar, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField,
  Toolbar, Typography, useMediaQuery, ThemeProvider, createTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import DomainRoundedIcon from '@mui/icons-material/DomainRounded';
import HotelRoundedIcon from '@mui/icons-material/HotelRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import './App.css';
import { adminApi, adminErrorMessage } from './services/adminApi';

const drawerWidth = 256;
const theme = createTheme({
  palette: {
    primary: { main: '#172D50' }, secondary: { main: '#7655D9' },
    background: { default: '#F7F8FC', paper: '#FFFFFF' },
    text: { primary: '#202B3C', secondary: '#7B8494' }, success: { main: '#269B72' },
  },
  typography: { fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', button: { textTransform: 'none', fontWeight: 700 } },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 16 } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 10, paddingInline: 16 } } },
  },
});

const navigation = [
  { label: 'Overview', path: '/', icon: <SpaceDashboardRoundedIcon /> },
  { label: 'Property reviews', path: '/applications', icon: <DomainRoundedIcon /> },
  { label: 'Properties', path: '/properties', icon: <HotelRoundedIcon /> },
  { label: 'Partners', path: '/partners', icon: <GroupsRoundedIcon /> },
  { label: 'Bookings', path: '/bookings', icon: <EventAvailableRoundedIcon /> },
];

function AdminShell({ children, admin, pendingCount, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const title = navigation.find((item) => item.path === location.pathname)?.label || 'Overview';
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'primary.main', color: '#fff' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2.5, py: 2.7 }}>
        <Box className="roomly-mark">R</Box>
        <Box><Typography fontWeight={800} fontSize={18} lineHeight={1.1}>roomly</Typography><Typography sx={{ opacity: .68, letterSpacing: 1.8 }} variant="caption">ADMIN CONSOLE</Typography></Box>
      </Stack>
      <Divider sx={{ borderColor: alpha('#fff', .12), mx: 2, mb: 2 }} />
      <Typography variant="overline" sx={{ px: 3, color: alpha('#fff', .52), letterSpacing: 1.3 }}>WORKSPACE</Typography>
      <List sx={{ px: 1.5, pt: 1 }}>
        {navigation.map((item) => (
          <ListItemButton key={item.path} component={NavLink} to={item.path} onClick={() => setMobileOpen(false)} className="admin-nav-link" sx={{ mb: .5, borderRadius: 2, color: alpha('#fff', .76), '&.active': { bgcolor: alpha('#fff', .14), color: '#fff' }, '&:hover': { bgcolor: alpha('#fff', .1) } }}>
            <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 13, fontWeight: 650 }} />
            {item.path === '/applications' && pendingCount > 0 && <Chip size="small" label={pendingCount} sx={{ height: 22, color: '#fff', bgcolor: alpha('#fff', .15), fontSize: 11 }} />}
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Paper sx={{ p: 1.8, bgcolor: alpha('#fff', .08), color: '#fff', border: `1px solid ${alpha('#fff', .12)}` }}>
          <Typography fontWeight={700} fontSize={12}>Live admin workspace</Typography>
          <Typography variant="caption" sx={{ opacity: .68, display: 'block', mt: .5 }}>Changes here update property review status in PostgreSQL.</Typography>
        </Paper>
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: 2.2, px: .5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#8A72E5', fontSize: 13 }}>{admin?.fullName?.slice(0, 1)?.toUpperCase() || 'A'}</Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}><Typography noWrap fontSize={12} fontWeight={700}>{admin?.fullName}</Typography><Typography noWrap variant="caption" sx={{ opacity: .6 }}>ID: {admin?.adminId}</Typography></Box>
          <IconButton aria-label="Log out" onClick={onLogout} size="small" sx={{ color: '#fff' }}><LogoutRoundedIcon fontSize="small" /></IconButton>
        </Stack>
      </Box>
    </Box>
  );
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile ? <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)} PaperProps={{ sx: { width: drawerWidth, border: 0 } }}>{drawer}</Drawer> : <Drawer variant="permanent" PaperProps={{ sx: { width: drawerWidth, border: 0, boxSizing: 'border-box' } }}>{drawer}</Drawer>}
      <Box sx={{ ml: { md: `${drawerWidth}px` } }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #E9ECF3', bgcolor: alpha('#fff', .94), backdropFilter: 'blur(12px)' }}>
          <Toolbar sx={{ minHeight: '72px !important', px: { xs: 2, md: 4 } }}>
            {isMobile && <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}><MenuRoundedIcon /></IconButton>}
            <Box sx={{ flexGrow: 1 }}><Typography variant="caption" color="text.secondary">Roomly / Admin</Typography><Typography fontWeight={750}>{title}</Typography></Box>
            <Chip label="LIVE DATA" size="small" color="success" variant="outlined" sx={{ mr: 1.5, fontWeight: 750, letterSpacing: .4 }} />
            <IconButton aria-label="Notifications"><NotificationsNoneRoundedIcon /></IconButton>
            <Avatar sx={{ width: 34, height: 34, ml: 1.2, bgcolor: '#EDE8FF', color: 'secondary.main', fontSize: 13, fontWeight: 800 }}>{admin?.fullName?.slice(0, 1)?.toUpperCase() || 'A'}</Avatar>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: { xs: 2, sm: 3, lg: 4 }, maxWidth: 1500, mx: 'auto' }}>{children}</Box>
      </Box>
    </Box>
  );
}

function AdminLogin({ onLogin }) {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try { await onLogin({ adminId, password }); }
    catch (loginError) { setError(adminErrorMessage(loginError, 'Invalid Admin ID or password.')); }
    finally { setLoading(false); }
  }
  return <Box className="admin-login-page"><Paper component="form" onSubmit={submit} className="admin-login-card">
    <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', mx: 'auto', mb: 2 }}><LockOutlinedIcon /></Avatar>
    <Typography variant="h4" fontWeight={800} textAlign="center" letterSpacing={-1}>Admin sign in</Typography>
    <Typography color="text.secondary" textAlign="center" sx={{ mt: .8, mb: 3 }}>Sign in with an authorized Roomly administrator account.</Typography>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Stack spacing={2}>
      <TextField label="Admin ID" placeholder="roomlyadmin" type="text" autoComplete="username" required fullWidth value={adminId} onChange={(event) => setAdminId(event.target.value)} />
      <TextField label="Password" type="password" autoComplete="current-password" required fullWidth value={password} onChange={(event) => setPassword(event.target.value)} />
      <Button type="submit" variant="contained" size="large" disabled={loading}>{loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in securely'}</Button>
    </Stack>
    <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mt: 2.5 }}>Default Admin ID: roomlyadmin. The backend setup prints a one-time generated password. Partner sign-up cannot create admins.</Typography>
  </Paper></Box>;
}

function MetricCard({ label, value, helper, icon, tone = 'navy' }) {
  const color = tone === 'purple' ? '#7655D9' : tone === 'green' ? '#269B72' : '#172D50';
  return <Paper className="metric-card" sx={{ p: 2.4, height: '100%' }}><Stack direction="row" justifyContent="space-between" alignItems="flex-start"><Box><Typography variant="body2" color="text.secondary" fontWeight={600}>{label}</Typography><Typography variant="h4" fontWeight={800} sx={{ mt: 1, letterSpacing: -1 }}>{value ?? '—'}</Typography><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>{helper}</Typography></Box><Avatar variant="rounded" sx={{ bgcolor: alpha(color, .1), color, width: 44, height: 44 }}>{icon}</Avatar></Stack></Paper>;
}

function ApplicationTable({ rows, onReview }) {
  if (!rows.length) return <Box sx={{ p: 5, textAlign: 'center' }}><Typography fontWeight={700}>No applications in this queue</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>New partner submissions will appear here.</Typography></Box>;
  return <TableContainer><Table sx={{ minWidth: 700 }}><TableHead><TableRow sx={{ bgcolor: '#FAFBFD' }}><TableCell>PROPERTY</TableCell><TableCell>PARTNER</TableCell><TableCell>LOCATION</TableCell><TableCell>SUBMITTED</TableCell><TableCell align="right">ACTION</TableCell></TableRow></TableHead><TableBody>{rows.map((row) => <TableRow key={row.propertyId} hover><TableCell><Typography fontWeight={700} fontSize={13}>{row.property}</Typography><Typography variant="caption" color="text.secondary">{row.id} · {row.type}</Typography></TableCell><TableCell>{row.owner}<Typography display="block" variant="caption" color="text.secondary">{row.email}</Typography></TableCell><TableCell>{[row.city, row.state].filter(Boolean).join(', ') || '—'}</TableCell><TableCell>{row.submitted}</TableCell><TableCell align="right"><Button size="small" variant="outlined" startIcon={<VisibilityRoundedIcon />} onClick={() => onReview(row)}>Review</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>;
}

function OverviewPage({ totals, applications, onReview, loading }) {
  const count = totals?.pendingApplications || 0;
  return <>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ mb: 3 }}>
      <Box><Typography variant="h4" fontWeight={800} letterSpacing={-1}>Good morning, Admin</Typography><Typography color="text.secondary" sx={{ mt: .6 }}>Live operations from your Roomly PostgreSQL database.</Typography></Box>
      <Chip icon={<PendingActionsRoundedIcon />} label={`${count} applications need review`} sx={{ bgcolor: '#FFF6E8', color: '#9A6712', fontWeight: 700 }} />
    </Stack>
    <Box className="metric-grid">
      <MetricCard label="Pending applications" value={totals?.pendingApplications ?? (loading ? '…' : 0)} helper="Awaiting first review" icon={<PendingActionsRoundedIcon />} tone="purple" />
      <MetricCard label="Approved properties" value={totals?.approvedProperties ?? (loading ? '…' : 0)} helper="Approved in the marketplace" icon={<CheckCircleRoundedIcon />} tone="green" />
      <MetricCard label="Partners" value={totals?.partners ?? (loading ? '…' : 0)} helper="Registered partner accounts" icon={<GroupsRoundedIcon />} />
      <MetricCard label="Bookings" value={totals?.bookings ?? 0} helper="Booking API is not available yet" icon={<TrendingUpRoundedIcon />} tone="green" />
    </Box>
    <Paper sx={{ mt: 3, overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 2.2 }}>
        <Box><Typography variant="h6" fontWeight={750}>Latest applications</Typography><Typography variant="body2" color="text.secondary">Review partner submissions.</Typography></Box>
        <Button component={NavLink} to="/applications" endIcon={<ArrowOutwardRoundedIcon />}>View queue</Button>
      </Stack>
      <ApplicationTable rows={applications.slice(0, 5)} onReview={onReview} />
    </Paper>
  </>;
}

function ApplicationsPage({ rows, onReview, status, onStatusChange }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => rows.filter((row) => `${row.property} ${row.owner} ${row.city} ${row.id}`.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  return <>
    <Box sx={{ mb: 3 }}><Typography variant="h4" fontWeight={800} letterSpacing={-1}>Property review queue</Typography><Typography color="text.secondary" sx={{ mt: .6 }}>Review submitted details and update the partner-visible status.</Typography></Box>
    <Paper sx={{ overflow: 'hidden' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ p: 2.5 }}>
        <Box><Typography fontWeight={750}>Applications</Typography><Typography variant="body2" color="text.secondary">{filtered.length} records from database</Typography></Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
          <TextField select size="small" value={status} onChange={(event) => onStatusChange(event.target.value)} sx={{ minWidth: 170 }} SelectProps={{ native: true }}><option value="PENDING_REVIEW">Pending review</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="ALL">All submitted</option></TextField>
          <TextField size="small" placeholder="Search property or partner" value={query} onChange={(event) => setQuery(event.target.value)} InputProps={{ startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }} sx={{ width: { xs: '100%', sm: 280 } }} />
        </Stack>
      </Stack>
      <ApplicationTable rows={filtered} onReview={onReview} />
    </Paper>
  </>;
}

function StatusChip({ status }) {
  const color = ['Approved', 'Active', 'Confirmed', 'Completed'].includes(status) ? 'success' : ['Rejected', 'Inactive', 'Cancelled'].includes(status) ? 'error' : 'warning';
  return <Chip size="small" label={status || 'Unknown'} color={color} variant="outlined" sx={{ fontWeight: 650 }} />;
}

function ManagementTable({ title, description, searchLabel, rows, columns, onAction }) {
  const [query, setQuery] = useState('');
  const filteredRows = useMemo(() => rows.filter((row) => Object.values(row).filter((value) => typeof value !== 'object').join(' ').toLowerCase().includes(query.toLowerCase())), [rows, query]);
  return <>
    <Box sx={{ mb: 3 }}><Typography variant="h4" fontWeight={800} letterSpacing={-1}>{title}</Typography><Typography color="text.secondary" sx={{ mt: .6 }}>{description}</Typography></Box>
    <Paper sx={{ overflow: 'hidden' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ p: 2.5 }}>
        <Box><Typography fontWeight={750}>{title}</Typography><Typography variant="body2" color="text.secondary">{filteredRows.length} records from database</Typography></Box>
        <TextField size="small" placeholder={searchLabel} value={query} onChange={(event) => setQuery(event.target.value)} InputProps={{ startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }} sx={{ width: { xs: '100%', sm: 300 } }} />
      </Stack>
      <TableContainer><Table sx={{ minWidth: 760 }}><TableHead><TableRow sx={{ bgcolor: '#FAFBFD' }}>{columns.map((column) => <TableCell key={column.label}>{column.label}</TableCell>)}<TableCell align="right">ACTION</TableCell></TableRow></TableHead>
        <TableBody>{filteredRows.length ? filteredRows.map((row) => <TableRow key={row.id} hover>{columns.map((column) => <TableCell key={column.label}>{column.render ? column.render(row) : row[column.key] || '—'}</TableCell>)}<TableCell align="right"><Button size="small" variant="outlined" onClick={() => onAction(row)}>View</Button></TableCell></TableRow>) : <TableRow><TableCell colSpan={columns.length + 1} align="center" sx={{ py: 6, color: 'text.secondary' }}>No matching records.</TableCell></TableRow>}</TableBody>
      </Table></TableContainer>
    </Paper>
  </>;
}

function PropertiesPage({ rows, onAction }) {
  return <ManagementTable title="Properties" description="Browse property listings and review status from PostgreSQL." searchLabel="Search properties" rows={rows} onAction={onAction} columns={[
    { label: 'PROPERTY', key: 'name', render: (row) => <><Typography fontWeight={700} fontSize={13}>{row.name}</Typography><Typography variant="caption" color="text.secondary">{row.id} · {row.type}</Typography></> },
    { label: 'PARTNER', key: 'partner' }, { label: 'CITY', key: 'city' }, { label: 'ROOMS', key: 'rooms' }, { label: 'STATUS', render: (row) => <StatusChip status={row.status} /> },
  ]} />;
}

function PartnersPage({ rows, onAction }) {
  return <ManagementTable title="Partners" description="Partner accounts and onboarding status from PostgreSQL." searchLabel="Search partners" rows={rows} onAction={onAction} columns={[
    { label: 'PARTNER', key: 'name', render: (row) => <><Typography fontWeight={700} fontSize={13}>{row.name}</Typography><Typography variant="caption" color="text.secondary">{row.id}</Typography></> },
    { label: 'EMAIL', key: 'email' }, { label: 'CITY', key: 'city' }, { label: 'PROPERTIES', key: 'properties' }, { label: 'JOINED', key: 'joined' }, { label: 'STATUS', render: (row) => <StatusChip status={row.status} /> },
  ]} />;
}

function BookingsPage() {
  return <><Box sx={{ mb: 3 }}><Typography variant="h4" fontWeight={800} letterSpacing={-1}>Bookings</Typography><Typography color="text.secondary" sx={{ mt: .6 }}>Hourly booking operations.</Typography></Box><Paper sx={{ p: 5, textAlign: 'center' }}><EventAvailableRoundedIcon color="disabled" sx={{ fontSize: 42, mb: 1 }} /><Typography fontWeight={750}>Booking data is not available yet</Typography><Typography color="text.secondary" variant="body2" sx={{ mt: .5 }}>The current backend schema does not include booking records.</Typography></Paper></>;
}

function AdminApp() {
  const [admin, setAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [noticeSeverity, setNoticeSeverity] = useState('success');
  const [overview, setOverview] = useState(null);
  const [applications, setApplications] = useState([]);
  const [properties, setProperties] = useState([]);
  const [partners, setPartners] = useState([]);
  const [applicationStatus, setApplicationStatus] = useState('PENDING_REVIEW');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    let mounted = true;
    adminApi.me().then((user) => { if (mounted) setAdmin(user); }).catch(() => {}).finally(() => { if (mounted) setAuthLoading(false); });
    return () => { mounted = false; };
  }, []);

  const loadData = useCallback(async () => {
    if (!admin) return;
    setDataLoading(true);
    setLoadError('');
    try {
      const [overviewData, applicationData, propertyData, partnerData] = await Promise.all([
        adminApi.overview(), adminApi.applications(applicationStatus), adminApi.properties('ALL'), adminApi.partners(),
      ]);
      setOverview(overviewData);
      setApplications(applicationData);
      setProperties(propertyData);
      setPartners(partnerData);
    } catch (error) { setLoadError(adminErrorMessage(error, 'Admin data could not be loaded.')); }
    finally { setDataLoading(false); }
  }, [admin, applicationStatus]);

  useEffect(() => {
    if (!admin) return undefined;
    void loadData();
    const interval = window.setInterval(() => { void loadData(); }, 30000);
    window.addEventListener('focus', loadData);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', loadData); };
  }, [admin, loadData]);

  async function login(credentials) {
    const user = await adminApi.login(credentials);
    setAdmin(user);
  }

  async function logout() {
    try { await adminApi.logout(); } finally { setAdmin(null); setOverview(null); }
  }

  async function changePropertyStatus(status) {
    if (!selectedApplication) return;
    setSavingReview(true);
    try {
      await adminApi.updatePropertyStatus(selectedApplication.propertyId, status, reviewNote);
      setSelectedApplication(null);
      setReviewNote('');
      setNoticeSeverity('success');
      setNotice(status === 'APPROVED' ? 'Property approved. The partner dashboard will show the updated status.' : 'Changes requested. The partner dashboard will show your review note.');
      await loadData();
    } catch (error) {
      setNoticeSeverity('error');
      setNotice(adminErrorMessage(error, 'Property status could not be updated.'));
    } finally { setSavingReview(false); }
  }

  const review = (row) => { setSelectedApplication(row); setReviewNote(row.reviewNote || ''); };
  const previewRecord = (row) => { setNoticeSeverity('info'); setNotice(`${row.name || row.id} · ${row.email || row.status || ''}`); };

  if (authLoading) return <ThemeProvider theme={theme}><CssBaseline /><Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box></ThemeProvider>;
  if (!admin) return <ThemeProvider theme={theme}><CssBaseline /><AdminLogin onLogin={login} /></ThemeProvider>;

  return <ThemeProvider theme={theme}><CssBaseline /><BrowserRouter>
    <AdminShell admin={admin} pendingCount={overview?.totals?.pendingApplications || 0} onLogout={logout}>
      {loadError && <Alert severity="error" action={<Button color="inherit" size="small" onClick={loadData}>Retry</Button>} sx={{ mb: 2 }}>{loadError}</Alert>}
      {dataLoading && !overview && <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}><CircularProgress size={18} /><Typography color="text.secondary">Loading live data…</Typography></Stack>}
      <Routes>
        <Route path="/" element={<OverviewPage totals={overview?.totals} applications={applications} onReview={review} loading={dataLoading} />} />
        <Route path="/applications" element={<ApplicationsPage rows={applications} onReview={review} status={applicationStatus} onStatusChange={setApplicationStatus} />} />
        <Route path="/properties" element={<PropertiesPage rows={properties} onAction={previewRecord} />} />
        <Route path="/partners" element={<PartnersPage rows={partners} onAction={previewRecord} />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="*" element={<OverviewPage totals={overview?.totals} applications={applications} onReview={review} loading={dataLoading} />} />
      </Routes>
    </AdminShell>
    <Dialog open={Boolean(selectedApplication)} onClose={() => !savingReview && setSelectedApplication(null)} fullWidth maxWidth="md">
      {selectedApplication && <>
        <DialogTitle sx={{ fontWeight: 800 }}>Review property application</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.3}>
            <Box><Typography variant="h6" fontWeight={750}>{selectedApplication.property}</Typography><Typography color="text.secondary">{selectedApplication.id} · {selectedApplication.type} · {selectedApplication.statusLabel}</Typography></Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap"><Chip label={`${selectedApplication.rooms} rooms`} /><Chip label={[selectedApplication.city, selectedApplication.state].filter(Boolean).join(', ') || 'Location not set'} /><Chip label={`Submitted ${selectedApplication.submitted}`} /></Stack>
            <Paper variant="outlined" sx={{ p: 2 }}><Typography variant="caption" color="text.secondary">PARTNER CONTACT</Typography><Typography fontWeight={700} sx={{ mt: .5 }}>{selectedApplication.owner}</Typography><Typography variant="body2" color="text.secondary">{selectedApplication.email}</Typography></Paper>
            <Box><Typography fontWeight={750} sx={{ mb: 1 }}>Property details</Typography><Typography variant="body2" color="text.secondary">{selectedApplication.address}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{selectedApplication.description || selectedApplication.onboardingData?.business?.description || 'No description provided.'}</Typography></Box>
            {selectedApplication.images?.length > 0 && <Box><Typography fontWeight={750} sx={{ mb: 1 }}>Property images</Typography><Box className="review-image-grid">{selectedApplication.images.map((image) => <Box key={image.id} component="img" src={image.imageUrl} alt={image.category} />)}</Box></Box>}
            <Box><Typography fontWeight={750} sx={{ mb: 1 }}>Rooms & hourly pricing</Typography>{selectedApplication.rooms?.length ? selectedApplication.rooms.map((room) => <Paper key={room.id} variant="outlined" sx={{ p: 1.5, mb: 1 }}><Typography fontWeight={700}>{room.roomNumber} · {room.roomName}</Typography><Typography variant="body2" color="text.secondary">{room.capacity} guests · {room.bedCount} beds · {room.roomType}</Typography><Typography variant="caption" color="text.secondary">{room.hourlyPricing?.map((price) => `${price.durationHours}h ₹${price.price}`).join(' · ') || 'No hourly rates'}</Typography></Paper>) : <Typography variant="body2" color="text.secondary">No room details attached.</Typography>}</Box>
            <TextField label="Review note (required when requesting changes)" multiline minRows={3} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} fullWidth inputProps={{ maxLength: 2000 }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setSelectedApplication(null)} disabled={savingReview}>Close</Button><Button color="error" variant="outlined" disabled={savingReview || reviewNote.trim().length < 4} onClick={() => changePropertyStatus('REJECTED')}>{savingReview ? 'Saving…' : 'Request changes'}</Button><Button variant="contained" disabled={savingReview} onClick={() => changePropertyStatus('APPROVED')}>{savingReview ? 'Saving…' : 'Approve property'}</Button></DialogActions>
      </>}
    </Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={5000} onClose={() => setNotice('')}><Alert severity={noticeSeverity} variant="filled" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
  </BrowserRouter></ThemeProvider>;
}

export default AdminApp;
