import React, { Component } from 'react';

class NavBar extends Component {
    render() { 
        return ( 
            <nav>
                <div class="nav-wrapper">
                    <a href="/" class="brand-logo">Hyperledger Certificate</a>
                    <ul id="nav-mobile" class="right hide-on-med-and-down">
                        <li></li>
                    </ul>
                </div>
            </nav>
        );
    }
}
    
export default NavBar;