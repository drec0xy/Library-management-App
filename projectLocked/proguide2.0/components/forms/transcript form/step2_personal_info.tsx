import * as React from 'react';
import Inputfield from '../../input Fields/input';
import Dropdown from '../../input Fields/dropdown';
import styles from '../../../styles/stylesheet01.module.css';
import Choicebox from '../../input Fields/choice';




export default function Step02() {
  return (
    <div className="container border rounded-3 col-md-12">
      <div className="row p-2 gx-5">
        <div className="col">
          <h4 className=" text-nowrap b-5">Personal Info</h4>
        </div>
        <div className="col">
          <span className="  bg-light">Step 2 of 4</span>
        </div>
      </div>

      <form className=" col-12 container d-flex flex-column p-2">
        <div>
          <label>Full Name</label>
        </div>
        <div>
          <input placeholder='Enter full name' className={`mb-3 ${styles.inputfield}`} type='text' aria-label="Default select example" />

        </div>
        <div>
          <label>Semester</label>
          <select className={`form-select mb-3 ${styles.inputfield}`} aria-label="Default select example">
            <option value="1">First</option>
            <option value="2">Second</option>
          </select>
        </div>
        <div>

          <Choicebox id={'student-status'} options={['Current', 'Former']} />
        </div>
        <div className="col-12">
          <button className={`btn col-12 btn-primary ${styles.button}`} type="submit">Procede</button>
        </div>
      </form>


    </div>
  );
}
