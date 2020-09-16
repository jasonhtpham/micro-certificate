import Axios from 'axios';
import React, { Component } from 'react';

const BACKEND_API_URL = 'http://localhost:5000';

class CertHistory extends Component {
    state = {

    };

    getCertHistory = async (e) => {
        e.preventDefault();

        const certId = e.target.certId.value;
        console.log(certId);

        try {
            const result = await Axios.get(`${BACKEND_API_URL}/getCertHistory?certId=${certId}`)

            console.log(result.data)

            if (result.data.certHistory) {
                console.log(result.data.certHistory);
            } else {
                throw Error("Certificate ID not found");
            }

        } catch (err) {
            return err;
        }
    }

    render() { 
        return ( 
            <div className="get-cert-history-container">
                <h3>Get Certificate's History</h3>
                    <form id="get-cert-history" method="get" onSubmit={this.getCertHistory}>
                    <div className="input-field col s6">
                        <input placeholder="Certificate ID" id="certId" type="text" className="validate" />
                        <label htmlFor="certId">Certificate ID</label>
                    </div>
                    <button className="btn waves-effect waves-light" type="submit" id="getCertHistoryBtn">
                        Get History
                    </button>
                </form>
            </div>
        );
    }
}
    
export default CertHistory;