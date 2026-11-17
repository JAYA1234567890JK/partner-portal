import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import AppRoutes from './routes/AppRoutes';
import { store } from './redux/store';
import theme from './theme/theme';
function App() { return <Provider store={store}><ThemeProvider theme={theme}><CssBaseline /><BrowserRouter><AppRoutes /></BrowserRouter></ThemeProvider></Provider>; }
export default App;
