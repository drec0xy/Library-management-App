import * as React from 'react';
import { alpha, styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import { inputfield } from '../../types';
import  Paper  from '@mui/material/Paper';
import  {InputLabel}  from '@mui/material';



const Inputfield: React.FC<inputfield> = ({id, label, icon, placeholder}) => {

return(  
  <div>
      <InputLabel      
        sx={{ ml: 1, flex: 1 }}
        shrink htmlFor="bootstrap-input">

          {label}
        </InputLabel>
      <TextField
        sx={{ ml: 1, flex: 1 }}
        placeholder={placeholder}
      />
  </div> 
  );
}

export default Inputfield