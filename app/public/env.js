$(document).ready(function() {
    $('.collapsible').collapsible();

    // A variable checking to check if it is the first call to registeredUsers endpoint
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

    // Clear all values in the page's forms
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



    // A func returns all certificates when the button is clicked
    $('#getAllCertsBtn').click( () => {
        $.get('/getAllCerts', (certs) => {
            alert(`Certificates on the ledger:\n${certs}`);
        })
    })

    // A func create certificate when the form is submitted
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

        // Post data to server to create certificate
        let posting = $.post('/createCert', data, (result) => {

            // Alert the confirmation if the certificate is successfully created
            if (result.certId) {
                clearValues();
                $('.error-msg').empty()
                $('#form-error').css('display', 'none')
                alert(`Certificate with ID ${result.certId} has been successfully created`);

            }

            // Display errors (if any) to inform users
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
            $('.progress').css('display', 'none')
        })
    });

    // A func returns certificates by name when the button is clicked
    $('#getCertByOwnerBtn').click( () => {
        const firstName = $('#firstNameToQuery').val();
        const lastName = $('#lastNameToQuery').val();

        const data = {
            firstName,
            lastName
        }

        $.get('/getCertByOwner', data, (result) => {
            // console.log('Certificates are returned successfully!');
            $('#certs-by-owner').html(result);
            clearValues();
        })
    });

    // A func returns a certificate's history when the button is clicked
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