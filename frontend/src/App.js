import React from 'react';
import NavBar from './components/navbar'
import Users from './components/users'

// import './App.css';
// import Counters from './components/counters';


function App() {
  return (
    <React.Fragment>
        <NavBar />
        <div className="container">
          <Users />
        </div>
    </React.Fragment>
    
  );
}

export default App;
