import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: { primary: { main: '#172D50', dark: '#10213B', light: '#35547D' }, secondary: { main: '#7655D9', light: '#EEE9FC' }, background: { default: '#F7F8FC', paper: '#FFFFFF' }, text: { primary: '#202B3C', secondary: '#7B8494' }, success: { main: '#269B72' } },
  typography: { fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif', button: { textTransform: 'none', fontWeight: 700 }, h1: { fontWeight: 750, letterSpacing: '-0.045em' }, h2: { fontWeight: 750, letterSpacing: '-0.04em' }, h4: { fontWeight: 750, letterSpacing: '-0.035em' } },
  shape: { borderRadius: 14 },
  components: { MuiButton: { styleOverrides: { root: { borderRadius: 12, padding: '12px 18px', boxShadow: 'none' }, containedPrimary: { '&:hover': { boxShadow: '0 8px 18px rgba(23,45,80,.18)' } } } }, MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12, backgroundColor: '#FFFFFF', '& fieldset': { borderColor: '#E5E8EF' }, '&:hover fieldset': { borderColor: '#B8C0CF' }, '&.Mui-focused fieldset': { borderWidth: 1.5 } }, input: { padding: '14px 14px' } } }, MuiPaper: { styleOverrides: { rounded: { borderRadius: 20 } } } },
});

export default theme;
