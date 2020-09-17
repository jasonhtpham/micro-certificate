import React, { Component } from 'react';

import {NavLink, Link} from 'react-router-dom';

class NavBar extends Component {
    render() { 
        return ( 
            <nav>
                <div className="nav-wrapper">
                    <a href="/" className="brand-logo">Hyperledger Certificate</a>
                    <ul id="nav-mobile" className="right hide-on-med-and-down">
                        <li> <Link to="/createCert"> Create Certificate </Link> </li>
                        <li> <NavLink to="/getCertByUser"> Get Certificates by User </NavLink> </li>
                        <li> <NavLink to="/getCertHistory"> Get Certificate History </NavLink> </li>
                    </ul>
                </div>
            </nav>
        );
    }
}
    
export default NavBar;