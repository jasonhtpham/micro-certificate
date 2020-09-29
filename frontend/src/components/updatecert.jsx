import React, { Component } from 'react';
import Axios from 'axios';

const BACKEND_API_URL = 'http://localhost:5000';


class UpdateCert extends Component {
    state = {
        errorMessages : [],
    };

    updateCert = async (e) => {
        e.preventDefault();
        document.getElementById('form-error').style.display = 'none';
        document.getElementsByClassName('update-progress')[0].style.display = 'block';

        const certId = e.target.certId.value;
        const owner = e.target.owner.value;
        const unitCode = e.target.unitCode.value;
        const grade = e.target.grade.value;
        const credit = e.target.credit.value;

        const updateDetails = {
            certId,
            owner,
            unitCode,
            grade,
            credit
        }        

        try {

            // Post data to server to update certificate
            const updateResult = await Axios.post(`${BACKEND_API_URL}/updateCert`, updateDetails);

            // The data with SUCCESS attribute which is the certID is returned if success.
            if (updateResult.data.success) {
                // Stop loading bar
                document.getElementsByClassName('update-progress')[0].style.display = 'none';

                this.props.onUpdate();
                alert(`The certificate ${updateResult.data.success} has been successfully updated`);
            }

        } catch (err) {

            this.handleErrors(err.response.data.errors);

            return err;
            
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
            document.getElementsByClassName('update-progress')[0].style.display = 'none';
        });
    }


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
                        <input value={this.props.certificate.record.ID} id="certId" type="text" className="validate" readOnly/>
                        <label htmlFor="certId">Certificate ID</label>
                    </div>
                    <div className="input-field col s6">
                        <input value={this.props.certificate.record.Owner} id="owner" type="text" className="validate" readOnly/>
                        <label htmlFor="firstName">Owner</label>
                    </div>
                    <div className="input-field col s6">
                        <input value={this.props.certificate.record.UnitCode} pattern="[A-Za-z]{3}[0-9]{3}" id="unitCode" type="text" className="validate" readOnly/>
                        <label htmlFor="unitCode">Unit Code</label>
                    </div>
                    <div className="input-field col s6">
                        <input defaultValue={this.props.certificate.record.Grade} id="grade" type="text" className="validate" />
                        <label htmlFor="grade">Grade</label>
                    </div>
                    <div className="input-field col s6">
                        <input defaultValue={this.props.certificate.record.Credit} id="credit" name="updateCert-credit" type="text" className="validate" />
                        <label htmlFor="credit">Credit Points</label>
                    </div>

                    <div className="update-progress" style={{ display: "none" }} >
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