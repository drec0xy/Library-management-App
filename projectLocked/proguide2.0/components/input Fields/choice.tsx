import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { UimIconProps } from 'unicons-typescript-demo/dist/index.types';
import * as React from 'react';
import styles from '../../styles/stylesheet01.module.css';
import { choices } from '../../types';



const Choicebox: React.FC<choices> = ({id, options}) => {

    return(  
      <div id={id}>
        <select className={`${styles.SelectBox} container-fluid`}   multiple={true}>
          {options.map(option => <option key = {option} className={`${styles.options} m-2 container-fluid `} value={option}>
            <i></i>
            {option}
          </option>)} 
        </select>
       
      </div> 
      );
    }
    
export default Choicebox