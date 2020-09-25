import Axios from 'axios';
import React, { Component } from 'react';

const BACKEND_API_URL = 'http://localhost:5000';

class CertHistory extends Component {
    state = {
        errorMessages : "",
        certHistory : []
    };

    getCertHistory = async (e) => {
        e.preventDefault();
        document.getElementById('certs-history-form-error').style.display = 'none';

        const certId = e.target.certId.value;

        try {
            const result = await Axios.get(`${BACKEND_API_URL}/getCertHistory?certId=${certId}`)


            if ( result.data.certHistory ) {
                const certHistory = JSON.parse(result.data.certHistory);
                
                certHistory.forEach(e => {
                    e.Date = {};
                    e.Date.date = this.secondsToDate(e.TimeStamp);
                })

                this.setState({certHistory}, () => {
                    document.getElementById('history-table').style.display = '';
                });
            }

        } catch (err) {
            this.setState({ errorMessages:err.response.data.errors.msg }, () => document.getElementById('certs-history-form-error').style.display = 'block');
            return err;
        } finally {
            document.getElementById('get-cert-history-form').reset();
        }
    }

    secondsToDate = (timeStamp) => {
        const milliseconds = timeStamp.seconds * 1000 + Math.round(timeStamp.nanos / 1000000);

        return new Date(milliseconds).toString();
    }

    render() { 
        return ( 
            <div className="get-cert-history-container">
                <h3>Get Certificate's History</h3>
                <div className="card-panel red lighten-4" id="certs-history-form-error" style={{display: "none"}} >
                    <span className="red-text text-darken-4">
                        <ul className="error-list">
                            {this.state.errorMessages}
                        </ul>
                    </span>
                </div>
                <form id="get-cert-history-form" method="GET" onSubmit={this.getCertHistory}>
                    <div className="input-field col s6">
                        <input placeholder="Certificate ID" id="certId" type="text" className="validate" />
                        <label htmlFor="certId">Certificate ID</label>
                    </div>
                    <button className="btn waves-effect waves-light" type="submit" id="getCertHistoryBtn">
                        Get History
                    </button>
                </form>

                <table id="history-table" style={{display:"none"}}>
                    <thead>
                      <tr>
                          <th>Date</th>
                          <th>Seconds</th>
                          <th>Nanos</th>
                          <th>Value</th>
                      </tr>
                    </thead>
            
                    <tbody>
                    {this.state.certHistory.map(history => (
                      <tr key={history.TimeStamp.nanos}>
                        <td>{history.Date.date}</td>
                        <td>{history.TimeStamp.seconds}</td>
                        <td>{history.TimeStamp.nanos}</td>
                        <td>
                            <p><b>Unit code:    </b> {history.Value.UnitCode}   </p>
                            <p><b>Grade:        </b> {history.Value.Grade}      </p>
                            <p><b>Credit point: </b> {history.Value.Credit}     </p>
                        </td>
                      </tr>
                    ))}
                    </tbody>

                </table>
            </div>
        );
    }
}
    
export default CertHistory;