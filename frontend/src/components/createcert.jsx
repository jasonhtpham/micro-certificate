import React, { Component } from 'react';
import Axios from 'axios';

const BACKEND_API_URL = 'http://localhost:5000';


class CreateCert extends Component {
    state = {
        errorMessages : [],
        sucess : false,
    };

    // A func create certificate when the form is submitted
    createCert = async (e) => {
        e.preventDefault();
        document.getElementById('form-error').style.display = 'none';

        const firstName = e.target.firstName.value;
        const lastName = e.target.lastName.value;
        const unitCode = e.target.unitCode.value;
        const grade = e.target.grade.value;
        const credit = e.target.credit.value;

        const certDetails = {
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
            const postingCertDetails = await Axios.post(`${BACKEND_API_URL}/createCert`, certDetails);
            
            // Stop loading bar
            document.getElementsByClassName('progress')[0].style.display = 'none';

            // The data with SUCCESS attribute which is the certID is returned if success.
            if (postingCertDetails.data.success) {
                this.setState({ success : true});
                alert(`A certificate has been successfully create with ID: ${postingCertDetails.data.success}`)
            }

            // The data with ERRORS attribute is returned if there are any errors.
            if (postingCertDetails.data.errors) {
                // display the error messages return from the server
                document.getElementById('form-error').style.display = 'block';

                let errorsRawArray = [];

                // Process error messages to get a unique values array of error messages
                const errors = postingCertDetails.data.errors;
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
            document.getElementById('create-cert-form').reset();
        }
    };


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
                        <input placeholder="First name" id="firstName" name="createcert-firstName" type="text" className="validate" />
                        <label htmlFor="firstName">First Name</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Last name" id="lastName" name="createcert-lastName" type="text" className="validate" />
                        <label htmlFor="lastName">Last Name</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Unit code (e.g. SIT123, MLA123)" pattern="[A-Za-z]{3}[0-9]{3}" id="unitCode" name="createcert-unitCode" type="text" className="validate" title="6-character Unit Code" />
                        <label htmlFor="unitCode">Unit Code</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Grade (from 1 to 100)" id="grade" name="createcert-grade" type="text" className="validate" />
                        <label htmlFor="grade">Grade</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Credit point" id="credit" name="createcert-credit" type="text" className="validate" />
                        <label htmlFor="credit">Credit Points</label>
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