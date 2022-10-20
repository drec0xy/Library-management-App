import '../styles/globals.css';
import "bootstrap/dist/css/bootstrap.css";
import type { AppProps } from 'next/app'
import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0B3C49',
      light: '#25625C',
    },
    secondary: {
      light: '#25625C',
      main: '#FF6B35',
      contrastText: '#ffcc00',
    }
    
  },
  typography: {
    fontFamily: 'Poppins',
      
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          h1: 'h2',
          h2: 'h2',
          h3: 'h2',
          h4: 'h2',
          h5: 'h2',
          h6: 'h2',
          subtitle1: 'h2',
          subtitle2: 'h2',
          body1: 'span',
          body2: 'span',
        },
      },
    },
  },
  spacing: [0, 4, 8, 16, 32, 64],
   breakpoints: {
    values: {
      xs: 576,
      sm: 600,
      md: 768,
      lg: 992,
      xl: 1536,
    } 
},
}
);

function MyApp({ Component, pageProps }: AppProps) {

  const router = useRouter();
  React.useEffect(() => {
    typeof document !== undefined
      ? require("bootstrap/dist/js/bootstrap")
      : null;
  }, [router.events]);
  return <Component {...pageProps} />
}

export default MyApp
