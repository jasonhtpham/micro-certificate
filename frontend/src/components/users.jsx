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
                <ul className="collection" id="userList">
                    {this.state.users.map (user => (
                        <li key={user._id} className="collection-item" >
                            <div className="row" style={{ textAlign : "center" }}>
                                <div className="col s2" style={{ fontSize : "medium" }}>
                                    {user.firstName} {user.lastName}
                                </div>

                                <div className="col s3 offset-s2">
                                    <button href="#" className="waves-effect waves-light btn-small">
                                        <i className="material-icons left">add</i>Create Certificate
                                    </button>
                                </div>

                                <div className="col s2 offset-s1">
                                    <button href="#" className="waves-effect waves-light btn-small">
                                        <i className="material-icons left">add</i>Get Certificates
                                    </button>
                                </div>
                            </div>
                            
                        </li>
                    ))}

                </ul>
            </div>
            
        );
    }
}
    
export default Users;
