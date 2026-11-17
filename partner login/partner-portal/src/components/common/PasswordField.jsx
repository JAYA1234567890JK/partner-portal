import { useState } from 'react';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
function PasswordField({ label = 'Password', ...props }) {
  const [visible, setVisible] = useState(false);
  return <TextField {...props} label={label} type={visible ? 'text' : 'password'} fullWidth InputProps={{ endAdornment: <InputAdornment position="end"><IconButton aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible((value) => !value)} edge="end" size="small">{visible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}</IconButton></InputAdornment>, ...props.InputProps }} />;
}
export default PasswordField;
