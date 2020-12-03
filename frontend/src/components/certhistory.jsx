import Axios from 'axios';
import React, { Component } from 'react';

// const BACKEND_API_URL = 'http://135.90.143.205:5000';
const BACKEND_API_URL = 'http://localhost:5000';


class CertHistory extends Component {
    state = {
        errorMessages : [],
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

            this.handleErrors(err.response.data.errors);
            return err;
            
        } finally {
            document.getElementById('get-cert-history-form').reset();
        }
    }

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
            document.getElementById('certs-history-form-error').style.display = 'block';
        });
    }

    /**
     * @description A function converting protobuff timestamp to normal Date.
     * 
     * @param {protoBuff.TimeStamp} timeStamp A timestamp object containing {seconds, nanos}.
     * 
     * @returns {string} A stringified Date value.
     */
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
                            {this.state.errorMessages.map (error => (
                                <li key={this.state.errorMessages.indexOf(error)} > {error} </li>
                            ))}
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
                            <p><b>Unit code:            </b> {history.Value.UnitCode}     </p>
                            <p><b>Mark:                 </b> {history.Value.Mark}         </p>
                            <p><b>Credit point:         </b> {history.Value.Credit}       </p>
                            <p><b>Teaching Period:      </b> {history.Value.Period}       </p>
                            <p><b>Education Provider:   </b> {history.Value.Provider}     </p>
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