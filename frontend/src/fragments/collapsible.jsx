import React, { Component } from 'react';

class Collapsible extends Component {
    state = {
        open: false
    }

    togglePanel(e){
        e.preventDefault();
        this.setState({open: !this.state.open});
    }

    componentDidUpdate(){
        
    }

    render() {
      return (
        <div>
            <div onClick={ (e) => this.togglePanel(e) } style={{
                cursor: 'pointer',
                border: 'solid 1px #f2f2f2',
                padding: '15px',
                backgroundColor: '#26a69a',
                color: '#FFF' }}>

                {this.props.title}

            </div>
            
            {this.state.open ? (
                <div style={{
                    cursor: 'pointer',
                    borderLeft: 'solid 1px #f2f2f2',
                    borderRight: 'solid 1px #f2f2f2',
                    borderBottom: 'solid 1px #f2f2f2',
                    borderRadius: '0 0 5px 5px',
                    padding: '15px',
                    fontSize: '14px'
                }}>
                    {this.props.children}
                </div>
                ) : null}
        </div>
        );
    }
}

export default Collapsible;
