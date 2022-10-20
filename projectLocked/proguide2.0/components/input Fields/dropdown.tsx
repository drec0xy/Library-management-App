import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import * as React from 'react';
import { choices } from '../../types';

const Dropdown: React.FC<choices> = ({id, options}) => {
    const handleChange = (event: SelectChangeEvent) => {
        setAge(event.target.value as string);
      };
    const age: string = ''
    return(  
      <div id={id}>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={age}
          label="Age"
          onChange={handleChange}
        >
          {options.map(option => <MenuItem key = {option} value={option}>{option}</MenuItem>)} 

        </Select>
      </div> 
      );
    }
    
export default Dropdown

function setAge(arg0: string) {
    throw new Error('Function not implemented.');
}
