
var sendButton = function (element, button){

    var send = true;

    if (button === 'Standby'){
        if (!confirm('Do you really want to shut down?')) {
            send = false;
        } 
    } 
    
    if (!send){
        return;
    }

    element.classList.add('active-button');

    fetch('api/remote/' + button).then(function(response){
        element.classList.remove('active-button');
    })
}

var selectView = function (view){
    
    var mainContainer = document.getElementById('main-content');
    var secondaryContainer = document.getElementById('secondary-container');

    var menuView = document.getElementById('menu-view');
    var digitsView = document.getElementById('digits-view');

    if (view === 'menu-view'){
        mainContainer.style.display="flex";
        secondaryContainer.style.display="none";
        
        menuView.classList.add('menu__choice--active');
        digitsView.classList.remove('menu__choice--active');
    }

    if (view === 'digits-view'){
        secondaryContainer.style.display="flex";
        mainContainer.style.display="none";

        digitsView.classList.add('menu__choice--active');
        menuView.classList.remove('menu__choice--active');
    }

}