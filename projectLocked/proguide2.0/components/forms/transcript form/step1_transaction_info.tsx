import * as React from 'react';
import Inputfield from '../../input Fields/input';
import Dropdown from '../../input Fields/dropdown';
import styles from '../../../styles/stylesheet01.module.css';



export default function Step01() {
  return (
    <div className="container border rounded-3 col-md-12 form-container">
        <div className="row p-2 gx-5">
            <div className="col">
                <h4 className=" text-nowrap b-5">Transaction details</h4>
            </div>
            <div className="col">
                <span className="  bg-light">Step 1 of 4</span>
            </div>
            </div>

            <form className=" col-12 container d-flex flex-column p-2">
            
                <div className="input-group">
                    <input className="form-control border-end-0 border" type="search" value="search" id="example-search-input"></input>
                    <span className="input-group-append">
                        <button className="btn btn-outline-secondary bg-white border-start-0 border-bottom-0 border ms-n5" type="button">
                            <i className="fa fa-search"></i>
                        </button>
                    </span>
            </div>
               <div className="mb-3">
               <label className="small mb-1 fw-light">Academic year</label>
               <select className={`form-select mb-3 ${styles.inputfield}`} aria-label="Default select example">
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                </select> 
               </div>
               <div className="mb-3">
               <label className="small mb-1 fw-light">Semester</label>
               <select className={`form-select mb-3 ${styles.inputfield}`} aria-label="Default select example">
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                </select> 
               </div>
               <div className="mb-3">
               <label className="small mb-1 fw-light">Department</label>
               <select className={`form-select mb-3 ${styles.inputfield}`} aria-label="Default select example">
                    <option value="1">One</option>
                    <option value="2">Two</option>
                    <option value="3">Three</option>
                </select> 
                </div>
                <div className="col-12 mb-3">
                    <button className={`btn col-12 btn-primary ${styles.button}`} type="submit">Procede</button>
                </div>
            </form>
           
            
    </div>
  );
}
