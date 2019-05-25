const appKey = "kid_Sy4IErFS";
const appSecret = "4d519dd332a6468aa4a2bd68053dbaed";
const baseUrl = "https://baas.kinvey.com/";

function showView(viewName) {
    $('main > section').hide();
    $('#' + viewName).show();
}

function showHideMenuLinks() {
    $('#linkHome').show();
    if (sessionStorage.getItem('authToken') == null){
        $('#linkLogin').show();
        $('#linkRegister').show();
        $('#linkListBooks').hide();
        $('#linkCreateBook').hide();
        $('#linkLogout').hide();
    }
    else{
        $('#linkLogin').hide();
        $('#linkRegister').hide();
        $('#linkListBooks').show();
        $('#linkCreateBook').show();
        $('#linkLogout').show();
    }
}

function showInfo(message) {
    $('#infoBox').text(message);
    $('#infoBox').show();
    setTimeout(function () {
        $('#infoBox').fadeOut()
    }, 3000);
}

function showError(errorMsg) {
    $('#errorBox').text('Error: ' + errorMsg);
    $('#errorBox').show();
}

$(function () {
    showHideMenuLinks();
    showView('viewHome');

    $('#linkHome').click(showHomeView);
    $('#linkLogin').click(showLoginView);
    $('#linkRegister').click(showRegisterView);
    $('#linkListBooks').click(listBooks);
    $('#linkCreateBook').click(showCreateBookView);
    $('#linkLogout').click(logout);

    $('#formLogin').submit(function(e) {event.preventDefault(); login()});
    $('#formRegister').submit(function(e) {event.preventDefault(); register()});
    $('#formCreateBook').submit(function(e) {event.preventDefault(); createBook()});

    $(document).on({
        ajaxStart: function () { $('#loadingBox').show()},
        ajaxStop: function () { $('#loadingBox').hide()}
    });
});

function showHomeView() {
    showView('viewHome');
}

function showLoginView() {
    showView('viewLogin');
}

function login() {
    const requestURL = baseUrl + "user/" + appKey + "/login";
    const headers = {
        'Authorization': "Basic " + btoa(appKey + ":" + appSecret)
    };
    let userData = {
        username: $('#loginUser').val(),
        password: $('#loginPass').val()
    };
    $.ajax({
        method: "POST",
        url: requestURL,
        headers: headers,
        data: userData,
        success: loginSuccess,
        error: handleAjaxError
    });

    function loginSuccess(response) {
        let userAuth = response._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        showHideMenuLinks();
        listBooks();
        showInfo('Login successful.');
    }
}

function showRegisterView() {
    showView('viewRegister');
}

function register() {
    const requestURL = baseUrl + "user/" + appKey + "/";
    const headers = {
        'Authorization': "Basic " + btoa(appKey + ":" + appSecret)
    };
    let userData = {
        username: $('#registerUser').val(),
        password: $('#registerPass').val()
    };
    $.ajax({
        method: "POST",
        url: requestURL,
        headers: headers,
        data: userData,
        success: registerSuccess,
        error: handleAjaxError
    });

    function registerSuccess(response) {
        let userAuth = response._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        showHideMenuLinks();
        listBooks();
        showInfo('User registration successful.');
    }
}

function handleAjaxError(response) {
    let errorMsg = JSON.stringify(response);
    if (response.readyState === 0){
        errorMsg = "Cannot connect due to network error.";
    }
    if (response.responseJSON && response.responseJSON.description){
        errorMsg = response.responseJSON.description;
    }
    showError(errorMsg);
}

function listBooks() {
    $('#books').empty();
    showView('viewBooks');

    const requestURL = baseUrl + "appdata/" + appKey + "/books";
    const headers = {
        'Authorization': "Kinvey " + sessionStorage.getItem('authToken')
    };
    $.ajax({
        method: "GET",
        url: requestURL,
        headers: headers,
        success: loadBooksSuccess,
        error: handleAjaxError
    });

    function loadBooksSuccess(books) {
        showInfo('Books loaded.');
        if (books.length == 0){
            $('#books').text('No books in the library.');
        }
        else{
            let booksTable = $('<table class="tableHeaders">')
                .append($('<tr>').append(
                    '<th id="titleRow">Title</th>',
                    '<th id="authorRow">Author</th>',
                    '<th id="descriptionRow">Description</th>'
                ));

            let rownum = 1;
            for (let book of books){
                booksTable.append($('<tr>').append(
                    $('<td class="cell">').text(book.title),
                    $('<td class="cell">').text(book.author),
                    $('<td class="cell">').text(book.description)
                ));

                // Load [Add comment] link
                booksTable.append($('<tr id="' + rownum + '">')
                        .append($('<td colspan="3">')
                            .append($('<div>' +
                                '<a href="#" ' +
                                'onclick="showAddComment(' + rownum + ')"' +
                                ' class="linkAddComment">[Add comment]</a>'))));
                
                // Load add comment form
                let text = "commentText";
                let author = "commentAuthor";
                let bookID = book.comments._id;
                console.log(bookID);
                booksTable.append($('<tr id="row' + rownum + '" class="hideComment">').append(
                    ($('<td colspan="3">').append($('<div>' +
                        '<form>' +
                            'Comment:' +
                            '<input type="text" id="commentText' + rownum +'" required>' +
                            'Author:' +
                            '<input type="text" id="commentAuthor' + rownum +'" required>' +
                            '<input type="submit" '  +
                        'value="Add comment" ' +
                        'id="addCommentSubmit' + rownum + '" ' +
                        'onclick="addBookComment(' + text + rownum + ',' + author + rownum + ', ' + bookID + ')">' +
                            '<input type="reset" value="Cancel" onclick="hideAddCommentForm(' + rownum + ')">' +
                            '</form>')))));
                rownum++;
            }
            $('#books').append(booksTable);
            $('.hideComment').hide();
        }
    }
}

function addBookComment(textID, authorID, bookID) {
    const requestUrl = baseUrl + "appdata/" + appKey + "/comments";
    const headers = {
        'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        'Content-Type': "application/json"
    };

    let text = $("#" + textID).val();
    let author = $("#" + authorID).val();

    let commentData = {
        type: "KinveyRef",        
        text: text,
        author: author,
        _id: bookID,
        _collection: "comments"
    };

    $.ajax({
        method: "POST",
        url: requestUrl,
        headers: headers,
        data: JSON.stringify(commentData),
        success: addBookCommentSuccess,
        error: handleAjaxError
    });

    function addBookCommentSuccess(response) {
        showInfo('Comment successfully created!');
    }
}

function showAddComment(rownum) {
    $('#' + rownum).hide(); // $('#1')
    $('#row' + rownum).show(); // $('#row1')
}

function hideAddCommentForm(rownum) {
    $('#' + rownum).show(); // $('#1')
    $('#row' + rownum).hide(); // $('#row1')
}

function showCreateBookView() {
    showView('viewCreateBook');
}

function createBook() {
    const requestURL = baseUrl + "appdata/" + appKey + "/books";
    const headers = {
        'Authorization': "Kinvey " + sessionStorage.getItem('authToken')
    };

    let bookData={
        title: $('#bookTitle').val(),
        author: $('#bookAuthor').val(),
        description: $('#bookDescription').val(),
        comments: {
            type: "KinveyRef",
            _id: $('#bookTitle').val(),
            _collection: "books"
        }
    };

    $.ajax({
        method: "POST",
        url: requestURL,
        headers: headers,
        data: bookData,
        success: createBookSuccess,
        error: handleAjaxError
    });
    
    function createBookSuccess(response) {
        listBooks();
        showInfo("Book created.");
    }
}

function logout() {
    sessionStorage.clear();
    showHideMenuLinks();
    showView('viewHome');
}





