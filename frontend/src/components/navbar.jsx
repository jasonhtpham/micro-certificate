import React, { Component } from 'react';

class NavBar extends Component {
    render() { 
        return ( 
            <nav>
                <div className="nav-wrapper">
                    <a href="/" className="brand-logo">Hyperledger Certificate</a>
                    
                    <ul id="nav-mobile" className="right hide-on-med-and-down">
                        <li> <a className="waves-effect waves-light btn" id="" href='/'> Users </a> </li>
                        <li> <a className="waves-effect waves-light btn" id="" href='/'> Create Certificate </a> </li>
                        <li> <a className="waves-effect waves-light btn" id="" href='/'> Get Certificates by User </a> </li>
                        <li> <a className="waves-effect waves-light btn" id="" href='/'> Get Certificate History </a> </li>
                    </ul>
                </div>
            </nav>
        );
    }
}
    
export default NavBar;