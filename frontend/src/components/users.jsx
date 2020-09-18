import React, { Component } from 'react';
import Axios from 'axios'

const BACKEND_API_URL = 'http://localhost:5000';
const CREATE_CERT_URL = 'http://localhost:3000/createCert';
const GET_CERT_URL = 'http://localhost:3000/getCertByUser';


class Users extends Component {
    state = {
        users : [],
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

    render() { 
        return ( 
            <div className="user-list-container">

                <h3>Registered Users</h3>

                    <ul className="collection" id="userList">
                        {this.state.users.map (user => (
                            <a href="#!" key={user._id} className="collection-item" onClick={this.handleUserClick}> {user.firstName} {user.lastName} </a>
                        ))}
                    </ul>

            </div>
            
        );
    }
}
    
export default Users;
