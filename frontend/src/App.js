import React from 'react';
import NavBar from './components/navbar'
import Users from './components/users'
import {Route} from 'react-router-dom'
import CreateCert from './components/createcert'
import CertByUser from './components/certbyuser'
import CertHistory from './components/certhistory'
import UpdateCert from './components/updatecert';


function App() {
  return (
    <React.Fragment>
        <NavBar />
        <div className="container">
          <Users />
          <Route path="/createCert" component={CreateCert} />
          <Route path="/getCertByUser" component={CertByUser} />
          <Route path="/getCertHistory" component={CertHistory} />
          <Route path="/updateCert" component={UpdateCert} />
        </div>
    </React.Fragment>
    
  );
}

export default App;
