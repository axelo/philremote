
const sendButton = (element, button) => {
    const send = true;

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
    });
}

const selectView = view => {
    const mainContainer = document.getElementById('main-content');
    const secondaryContainer = document.getElementById('secondary-container');
    const menuView = document.getElementById('menu-view');
    const digitsView = document.getElementById('digits-view');

    if (view === 'menu-view'){
        mainContainer.style.display="flex";
        secondaryContainer.style.display="none";
        menuView.classList.add('tab-menu__choice--active');
        digitsView.classList.remove('tab-menu__choice--active');
    }
    
    if (view === 'digits-view'){
        secondaryContainer.style.display="flex";
        mainContainer.style.display="none";
        digitsView.classList.add('tab-menu__choice--active');
        menuView.classList.remove('tab-menu__choice--active');
    }
}