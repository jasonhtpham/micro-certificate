import React, { Component } from 'react';
import Axios from 'axios';

const BACKEND_API_URL = 'http://localhost:5000';


class UpdateCert extends Component {
    state = {
        errorMessages : [],
    };

    // A func create certificate when the form is submitted
    updateCert = async (e) => {
        e.preventDefault();
        document.getElementById('form-error').style.display = 'none';

        const certId = e.target.certId.value;
        const firstName = e.target.firstName.value;
        const lastName = e.target.lastName.value;
        const unitCode = e.target.unitCode.value;
        const grade = e.target.grade.value;
        const credit = e.target.credit.value;

        const updateDetails = {
            certId,
            firstName,
            lastName,
            unitCode,
            grade,
            credit
        }

        // Loading bar run
        document.getElementsByClassName('progress')[0].style.display = 'block';

        try {
            // Post data to server to create certificate
            // data will be sent back with either attribute `success or errors`
            const updateResult = await Axios.post(`${BACKEND_API_URL}/updateCert`, updateDetails);
            
            // Stop loading bar
            document.getElementsByClassName('progress')[0].style.display = 'none';

            // The data with SUCCESS attribute which is the certID is returned if success.
            if (updateResult.data.success) {
                alert(`The certificate ${updateResult.data.success} has been successfully updated`);
            }

            // The data with ERRORS attribute is returned if there are any errors.
            if (updateResult.data.errors) {
                // display the error messages return from the server
                document.getElementById('form-error').style.display = 'block';

                let errorsRawArray = [];

                // Process error messages to get a unique values array of error messages
                const errors = updateResult.data.errors;
                errors.forEach(error => {
                    errorsRawArray.push(error.msg);
                });
                
                const errorsSet = new Set([...errorsRawArray]);
                const errorMessages = [...errorsSet]
                
                this.setState({errorMessages})
            }
        } catch (err) {
            return err;
        } finally {
            // reset form when the the form is submitted
            document.getElementById('update-cert-form').reset();
        }
    };


    render() { 
        return (
            <div className="update-cert-container" id="update-cert-container">
                <h3>Update Certificate</h3>
                <div className="card-panel red lighten-4" id="form-error" style={{display: "none"}} >
                    <span className="red-text text-darken-4">
                        <ul className="error-list">
                            {this.state.errorMessages.map (error => (
                                <li key={this.state.errorMessages.indexOf(error)} > {error} </li>
                            ))}
                        </ul>
                    </span>
                </div>
                <form className="update-cert-form" id="update-cert-form" method="POST" onSubmit={this.updateCert}>
                    <div className="input-field col s6">
                        <input placeholder="Certificate ID" id="certId" name="updateCert-certId" type="text" className="validate" />
                        <label htmlFor="certId">Certificate ID</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="First name" id="firstName" name="updateCert-firstName" type="text" className="validate" />
                        <label htmlFor="firstName">First Name</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Last name" id="lastName" name="updateCert-lastName" type="text" className="validate" />
                        <label htmlFor="lastName">Last Name</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Unit code (e.g. SIT123, MLA123)" pattern="[A-Za-z]{3}[0-9]{3}" id="unitCode" name="updateCert-unitCode" type="text" className="validate" title="6-character Unit Code" />
                        <label htmlFor="unitCode">Unit Code</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Grade (from 1 to 100)" id="grade" name="updateCert-grade" type="text" className="validate" />
                        <label htmlFor="grade">Grade</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Credit points" id="credit" name="updateCert-credit" type="text" className="validate" />
                        <label htmlFor="credit">Credit Points</label>
                    </div>

                    <div className="progress" style={{ display: "none" }} >
                        <div className="indeterminate"></div>
                    </div>
        
                    <button className="btn waves-effect waves-light" type="submit" id="updateCertBtn" >
                        Update Certificate
                    </button>
                </form>
            </div>

        );
    }
}
    
export default UpdateCert;