// const MongoClient = require('mongodb').MongoClient;

// // Load the database object
// const uri = "mongodb+srv://dbUser:dbUser@hyperledgercertificate.hgp6r.mongodb.net/firstdb?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

$(document).ready(function() {
    console.log('Document ready')

    
    $('.collapsible').collapsible();
    

    /**
     * === /registeredUsers ===
     * 
     * Summary: Get registered users from the database.
     * 
     * Description: HTMLElement which is a list users is appended into the page. setInterval() was added initially to provide responsive users update.
     * But this caused a bug of inconsitent states in the backend and the frontend, thus, was commented out.
     * 
     * @see /registeredUsers in ../server.js
     * 
     * @fires addName() when any buttons are clicked
     * 
     * @param {Object} users returned from the database
     * 
     * 
     */

    // setInterval( () => {
    $.get('/registeredUsers', (users) => {
        $.each(users, (index, userObj) => {
            $('.collapsible').append(
                `<li> 
                    <div class="collapsible-header">${userObj.firstName} ${userObj.lastName}</div>
                    <div class="collapsible-body">
                        <a href="#create-cert-container" onclick="addName(event)" name="${userObj.firstName} ${userObj.lastName}" class="waves-effect waves-light btn">
                            <i class="material-icons left">add</i>Create Certificate
                        </a>
                        <a href="#get-certs-by-owner-container" onclick="addName(event)" name="${userObj.firstName} ${userObj.lastName}" class="waves-effect waves-light btn">
                            <i class="material-icons left">add</i>Get Certificates
                        </a>
                    </div>
                </li>`);
        });
    })
    // },1000)
/*
<a href="#userList" onclick="addName(event.target.innerText)" class="collection-item" id=${userObj._id}>
                        ${userObj.firstName} ${userObj.lastName}
                        </a>
*/
     
    /**
     * Summary: A helper function adding names into forms according to users' input.
     * 
     * Description: firstName and lastName are added to the form entries according to the chosen
     * user.
     * 
     * @listens /registeredUsers for any buttons to be clicked -> execute the relevant case.
     * 
     * @param event is passed when the button is clicked. Event's attributes are accessed to retrieve desire information.
     * 
     */
    addName = (event) => {
        const target = event.target.hash;

        const splittedName = event.target.name.split(' ');
        const firstName = splittedName[0];
        const lastName = splittedName[1];

        if (target === '#create-cert-container'){
            $('#firstName').val(firstName);
            $('#lastName').val(lastName);
        }

        if (target === '#get-certs-by-owner-container'){
            $('#firstNameToQuery').val(firstName);
            $('#lastNameToQuery').val(lastName);
        }
    }

    /**
     * Summary: clear all values in the page's forms.
     */
    clearValues = () => {
        $('#firstName').val('');
        $('#lastName').val('');
        $('#unitCode').val('');
        $('#grade').val('');
        $('#credit').val('');
        $('#firstNameToQuery').val('');
        $('#lastNameToQuery').val('');
        $('#certId').val('');
    }


    $('#getAllCertsBtn').click( () => {
        $.get('/getAllCerts', (certs) => {
            alert(`Certificates on the ledger:\n${certs}`);
        })
    })

    $('#create-cert-form').submit( (event) => {
        $('.progress').css('display', 'block');
        event.preventDefault();

        const firstName = $('#firstName').val();
        const lastName = $('#lastName').val();
        const unitCode = $('#unitCode').val();
        const grade = $('#grade').val();
        const credit = $('#credit').val();

        const data = {
            firstName,
            lastName,
            unitCode,
            grade,
            credit
        }

        let posting = $.post('/createCert', data, (result) => {

            if (result.certId) {
                clearValues();
                $('.error-msg').empty()
                $('#form-error').css('display', 'none')
                alert(`Certificate with ID ${result.certId} has been successfully created`);

            }

            if (result.error) {
                $.get('/createCert', (errors) => {
                    $('.error-msg').empty()
                    $('#form-error').css('display', 'block')
                    $.each(errors, (index, error) => {
                        $('.error-list').append(
                            `<li class="error-msg">
                            ${error.msg}
                            </li>`
                        )
                    });
                });
            }
        })

        posting.done(() => {
            console.log('DONE');
            $('.progress').css('display', 'none')
        })
    });


    $('#getCertByOwnerBtn').click( () => {
        const firstName = $('#firstNameToQuery').val();
        const lastName = $('#lastNameToQuery').val();

        const data = {
            firstName,
            lastName
        }

        $.get('/getCertByOwner', data, (certs) => {
            // console.log('Certificates are returned successfully!');
            $('#certs-by-owner').html(certs);
            clearValues();
        })
    });

    $('#getCertHistoryBtn').click( () => {
        const certId = $('#certId').val();

        const data = {
            certId
        }

        $.get('/getCertHistory', data, (certHistory) => {
            console.log('Histories are returned successfully!');
            $('#cert-history').html(certHistory);
            clearValues();
        })
    });
})