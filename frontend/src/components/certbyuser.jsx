import React, { Component } from 'react';
import Axios from 'axios';

const BACKEND_API_URL = 'http://localhost:5000';


class CertByUser extends Component {
    state = {
        errorMessages: "",
        certificates: []
    }

    getCertByUser = async (e) => {
        e.preventDefault();
        document.getElementById('get-certs-form-error').style.display = 'none';

        const firstName = e.target.firstNameToQuery.value;
        const lastName = e.target.lastNameToQuery.value;

        try {
            const result = await Axios.get(`${BACKEND_API_URL}/getCertsByOwner?firstName=${firstName}&lastName=${lastName}`);

            if (result.data.certs) {
                console.log(result.data.certs);
                // let certsArray = [];

                // result.data.errors.forEach(cert => {
                //     console.log(cert);

                //     const certObj = {
                //         key:cert.Key,
                //         record: cert.Record
                //     }

                //     certsArray.push(certObj)
                // });

                // console.log(certsArray)

            } else {
                this.setState({errorMessages:result.data.errors.msg}, () => document.getElementById('get-certs-form-error').style.display = 'block');
            }

        } catch (err) {
            return err;
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

                    <button className="btn waves-effect waves-light" type="submit" id="getCertsByOwnerBtn">
                        Get Certificates
                    </button>
                </form>
                <p className="certs-by-owner-result" id="certs-by-owner"></p>
            </div>
        );
    }
}
    
export default CertByUser;