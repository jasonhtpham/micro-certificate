$(document).ready(function() {
    console.log('Document ready')

    $('#registerBtn').click( () => {
        const firstName = $('#firstName').val();
        const lastName = $('#lastName').val();
        const unitCode = $('#unitCode').val();
        const email = $('#email').val();
        const phone = $('#phone').val();

        data = {
            firstName,
            lastName,
            unitCode,
            email,
            phone
        }

        $.get('/register', data, (resultString) => {
            if (!resultString) {
                alert(resultString);
            } else {
                alert(`${resultString}`);
            }
        })
    });

    $('#skipReg').click( () => {
        alert('Already registered check');
        window.location.assign('http://localhost:3000/');
    });
})