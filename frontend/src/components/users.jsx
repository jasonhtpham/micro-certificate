import React, { Component } from 'react';
import Axios from 'axios'

const BACKEND_API_URL = 'http://localhost:5000';

class Users extends Component {
    state = {
        users : [],
    }

    componentDidMount = async () => {
        try {
            const usersResponse = await Axios.get(`${BACKEND_API_URL}/registeredUsers`);
            const usersArray = await usersResponse.data;

            this.setState({users : usersArray});
        } catch (err) {
            return err;
        }
        
    }

    render() { 
        return ( 
            <div className="user-list-container">
                <h3>Registered Users</h3>
                <ul className="collapsible" id="userList">
                    {this.state.users.map (user => (
                        <li key={user._id} > 
                            <div className="collapsible-header">{user.firstName} {user.lastName}</div>
                            <div className="collapsible-body">
                                {/* <a href="#create-cert-container" onclick="addName(event)" name="{user.firstName} {user.lastName}" class="waves-effect waves-light btn">
                                    <i className="material-icons left">add</i>Create Certificate
                                </a>
                                <a href="#get-certs-by-owner-container" onclick="addName(event)" name="{user.firstName} {user.lastName}" class="waves-effect waves-light btn">
                                    <i className="material-icons left">add</i>Get Certificates
                                </a> */}
                            </div>
                        </li>
                    ))}

                </ul>
            </div>
            
        );
    }
}
    
export default Users;
