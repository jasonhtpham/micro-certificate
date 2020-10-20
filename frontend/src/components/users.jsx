import React, { Component } from 'react';
import Axios from 'axios'
import Collapsible from '../fragments/collapsible';

const BACKEND_API_URL = 'http://135.90.143.205:5000';

// const CREATE_CERT_URL = 'http://135.90.143.205:3000/createCert';
// const GET_CERT_URL = 'http://135.90.143.205:3000/getCertByUser';

const CREATE_CERT_URL = 'http://localhost:3000/createCert';
const GET_CERT_URL = 'http://localhost:3000/getCertByUser';


class Users extends Component {
    state = {
        users : [],
        certificates: [],
        showAllCertsBtn: true,
    }

    componentDidMount = async () => {

        try {
            const usersResponse = await Axios.get(`${BACKEND_API_URL}/registeredUsers`);
            const usersArray = usersResponse.data;

            this.setState({users : usersArray});
        } catch (err) {
            return err;
        }
    }

    toggleShowAllCertsBtn = (props) => {
        this.setState({ showAllCertsBtn:props.showAllCertsBtn });
    }

    handleUserClick = (e) => {
        e.preventDefault();
        const firstName = e.target.text.trim().split(' ')[0];
        const lastName = e.target.text.trim().split(' ')[1];

        if (window.location.href === GET_CERT_URL) {
            document.getElementById('firstNameToQuery').value = firstName;
            document.getElementById('lastNameToQuery').value = lastName;
        }

        if (window.location.href === CREATE_CERT_URL) {
            document.getElementById('firstName').value = firstName;
            document.getElementById('lastName').value = lastName;
        }

    }

    handleAllCerts = async (e) => {
        e.preventDefault();

        try {
            const result = await Axios.get(`${BACKEND_API_URL}/getAllCerts`);
            
            console.log(result.data.length)

            if (result.data.length > 0) {

                let certsArray = [];

                // Taking each certificate out and push it in a temp array
                result.data.forEach(cert => {

                    const certObj = {
                        key : cert.Key,
                        record : cert.Record
                    }

                    certsArray.push(certObj)
                });

                // Set the temp array above to be the certificates state
                this.setState({ certificates:certsArray }, () => console.log(this.state.certificates));
            }
        } catch (err) {
            return err;
        }
    }

    render() { 
        return ( 
            <div className="root">
                
                <div className="user-list-container">
                    <h3>Registered Users</h3>

                    <ul className="collection" id="userList">
                        {this.state.users.map (user => (
                            <a href="#!" key={user._id} className="collection-item" onClick={this.handleUserClick}> {user.firstName} {user.lastName} </a>
                        ))}
                    </ul>
                </div>
                
                {this.state.showAllCertsBtn
                    ?   <div className="all-certs-btn" id="all-certs-btn">
                            <div className="row">
                                <button className="btn waves-effect waves-light col s2 offset-s5" type="button" onClick={this.handleAllCerts} >
                                    All Certificates
                                </button>
                            </div>
                        </div>
                        
                    : null
                }

                <br />

                <div className="certificates-list">
                    {this.state.certificates.map(certificate => (
                        <Collapsible title={certificate.key} className="certificate" key={certificate.key}>
                                <div className="certificate-content">
                                    <p> <b>Unit Code:           </b> {certificate.record.UnitCode}    </p>
                                    <p> <b>Mark:                </b> {certificate.record.Mark}        </p>
                                    <p> <b>Credit Point(s):     </b> {certificate.record.Credit}      </p>
                                    <p> <b>Teaching Period:     </b> {certificate.record.Period}      </p>
                                    <p> <b>Education Provider:  </b> {certificate.record.Provider}    </p>
                                </div> 
                        </Collapsible>
                    ))}
                </div>

            </div>
        );
    }
}
    
export default Users;
