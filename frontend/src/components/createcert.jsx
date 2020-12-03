import React, { Component } from 'react';
import Axios from 'axios';

// const BACKEND_API_URL = 'http://135.90.143.205:5000';
const BACKEND_API_URL = 'http://localhost:5000';


class CreateCert extends Component {
    state = {
        errorMessages : [],
    };

    // A func create certificate when the form is submitted
    createCert = async (e) => {
        e.preventDefault();
        document.getElementById('form-error').style.display = 'none';

        const studentID = e.target.studentID.value;
        const firstName = e.target.firstName.value;
        const lastName = e.target.lastName.value;
        const unitCode = e.target.unitCode.value;
        const mark = e.target.mark.value;
        const credit = e.target.credit.value;
        const period = e.target.period.value;
        const provider = e.target.provider.value;

        const certDetails = {
            studentID,
            firstName,
            lastName,
            unitCode,
            mark,
            credit,
            period,
            provider
        }

        // Loading bar run
        document.getElementsByClassName('progress')[0].style.display = 'block';

        try {
            // Post data to server to create certificate
            // data will be sent back with either attribute `success or errors`
            const postingCertDetails = await Axios.post(`${BACKEND_API_URL}/createCert`, certDetails);

            // The data with SUCCESS attribute which is the certID is returned if success.
            if (postingCertDetails.data.success) {
                // Stop loading bar
                document.getElementsByClassName('progress')[0].style.display = 'none';

                alert(`A certificate has been successfully create with ID: ${postingCertDetails.data.success}`);
            }

        } catch (err) {

            this.handleErrors(err.response.data.errors)
            return err;
            
        } finally {
            // reset form when the the form is submitted
            document.getElementById('create-cert-form').reset();
        }
    };

     /**
     * @description A function handling errors responsed by the server.
     * 
     * @param {Array} errors An array of error messages returned from the server.
     */
    handleErrors = (errors) => {
        // display the error messages return from the server
        let errorsRawArray = [];

        errors.forEach(error => {
            errorsRawArray.push(error.msg);
        });
        
        const errorsSet = new Set([...errorsRawArray]);
        const errorMessages = [...errorsSet]
        
        this.setState({errorMessages}, () => {
            document.getElementById('form-error').style.display = 'block';
            document.getElementsByClassName('progress')[0].style.display = 'none';
        });
    }


    render() { 
        return (
            <div className="create-cert-container" id="create-cert-container">
                <h3>Create Certificate</h3>
                <div className="card-panel red lighten-4" id="form-error" style={{display: "none"}} >
                    <span className="red-text text-darken-4">
                        <ul className="error-list">
                            {this.state.errorMessages.map (error => (
                                <li key={this.state.errorMessages.indexOf(error)} > {error} </li>
                            ))}
                        </ul>
                    </span>
                </div>
                <form className="create-cert-form" id="create-cert-form" method="POST" onSubmit={this.createCert}>
                    <div className="input-field col s6">
                        <input placeholder="Student ID (9-digit number)" pattern="[0-9]{9}" id="studentID" type="text" className="validate" />
                        <label htmlFor="studentID">Student ID</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="First name" id="firstName" type="text" className="validate" />
                        <label htmlFor="firstName">First Name</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Last name" id="lastName" type="text" className="validate" />
                        <label htmlFor="lastName">Last Name</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Unit code (e.g. SIT123, MLA123)" pattern="[A-Za-z]{3}[0-9]{3}" id="unitCode" type="text" className="validate" title="6-character Unit Code" />
                        <label htmlFor="unitCode">Unit Code</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Mark (from 1 to 100)" id="mark" type="text" className="validate" />
                        <label htmlFor="mark">Mark</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Credit point" id="credit" type="text" className="validate" />
                        <label htmlFor="credit">Credit Points</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Teaching period" id="period" type="text" className="validate" />
                        <label htmlFor="period">Teaching Period</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Education Provider" id="provider" type="text" className="validate" />
                        <label htmlFor="provider">Education Provider</label>
                    </div>

                    <div className="progress" style={{ display: "none" }} >
                        <div className="indeterminate"></div>
                    </div>
        
                    <button className="btn waves-effect waves-light" type="submit" id="createCertBtn" >
                        Create Certificate
                    </button>
                </form>
            </div>

        );
    }
}
    
export default CreateCert;