
var sendButton = function (button){
    fetch('api/remote/' + button).then(function(response){
        console.log('hrjhrhjbrjk');
    })
}

var selectView = function (view){
    
    var mainContainer = document.getElementById('main-content');
    var secondaryContainer = document.getElementById('secondary-container');

    var menuView = document.getElementById('menu-view');
    var digitsView = document.getElementById('digits-view');

    if (view === 'menu-view'){
        mainContainer.style.display="block";
        secondaryContainer.style.display="none";
        
        menuView.classList.add('menu__choice--active');
        digitsView.classList.remove('menu__choice--active');
    }

    if (view === 'digits-view'){
        secondaryContainer.style.display="block";
        mainContainer.style.display="none";

        digitsView.classList.add('menu__choice--active');
        menuView.classList.remove('menu__choice--active');
    }

}