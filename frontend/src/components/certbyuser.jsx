import React, { Component } from 'react';
import Axios from 'axios';
import Collapsible from '../fragments/collapsible';

const BACKEND_API_URL = 'http://localhost:5000';


class CertByUser extends Component {
    state = {
        errorMessages: "",
        certificates: []
    }

    getCertByUser = async (e) => {
        e.preventDefault();
        document.getElementById('get-certs-form-error').style.display = 'none';
        document.getElementsByClassName('progress')[0].style.display = 'block';
        

        const firstName = e.target.firstNameToQuery.value;
        const lastName = e.target.lastNameToQuery.value;

        try {
            const result = await Axios.get(`${BACKEND_API_URL}/getCertsByOwner?firstName=${firstName}&lastName=${lastName}`);

            // console.log(JSON.parse(result.data.certs));

            if (result.data.certs) {
                // alert(`${result.data.certs}`);

                const certsList = JSON.parse(result.data.certs);

                let certsArray = [];

                certsList.forEach(cert => {
                    // console.log(cert);

                    const certObj = {
                        key : cert.Key,
                        record : cert.Record
                    }

                    certsArray.push(certObj)
                });

                this.setState({ certificates:certsArray }, () => document.getElementsByClassName('progress')[0].style.display = 'none');

            } else {
                this.setState({errorMessages:result.data.errors.msg}, () => document.getElementById('get-certs-form-error').style.display = 'block');
            }

        } catch (err) {
            return err;
        } finally {
            document.getElementById('cert-by-user-form').reset();
        }
    }

    render() { 
        return (
            <div className="get-certs-by-owner-container" id="get-certs-by-owner-container">
                <h3>Get Certificates by Name</h3>
                <div className="card-panel red lighten-4" id="get-certs-form-error" style={{display: "none"}} >
                    <span className="red-text text-darken-4">
                        <ul className="error-list">
                            {this.state.errorMessages}
                        </ul>
                    </span>
                </div>
                <form id="cert-by-user-form" method="GET" onSubmit={this.getCertByUser}>
                    <div className="input-field col s6">
                        <input placeholder="First name" id="firstNameToQuery" type="text" className="validate" />
                        <label htmlFor="firstNameToQuery">First Name</label>
                    </div>
                    <div className="input-field col s6">
                        <input placeholder="Last name" id="lastNameToQuery" type="text" className="validate" />
                        <label htmlFor="lastNameToQuery">Last Name</label>
                    </div>

                    <div className="progress" style={{ display: "none" }} >
                        <div className="indeterminate"></div>
                    </div>

                    <button className="btn waves-effect waves-light" autoFocus type="submit" id="getCertsByOwnerBtn">
                        Get Certificates
                    </button>
                </form>

                <br />

                <div className="certificates-list">
                    {this.state.certificates.map(certificate => (
                        <Collapsible title={certificate.key} className="certificate" key={certificate.key}>
                            <div className="certificate-content">
                                <p> <b>Unit Code:</b> {certificate.record.UnitCode} </p>
                                <p> <b>Grade:</b> {certificate.record.Grade} </p>
                                <p> <b>Credit Point(s):</b> {certificate.record.Credit} </p>
                            </div>
                        </Collapsible>
                    ))}
                </div>
            </div>
        );
    }
}
    
export default CertByUser;