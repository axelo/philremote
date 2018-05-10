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

const mainView = document.getElementById('main-container');
const hammertime = new Hammer(mainView);

hammertime.on('swipe', function(ev) {
    
    if (ev.direction === Hammer.DIRECTION_LEFT){
        selectView('digits-view');
    }
    if (ev.direction === Hammer.DIRECTION_RIGHT){
        selectView('menu-view');
    }

});

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

        hammertime.get('swipe').set({ direction: Hammer.DIRECTION_LEFT });
    }
    
    if (view === 'digits-view'){
        secondaryContainer.style.display="flex";
        mainContainer.style.display="none";
        digitsView.classList.add('tab-menu__choice--active');
        menuView.classList.remove('tab-menu__choice--active');

        hammertime.get('swipe').set({ direction: Hammer.DIRECTION_RIGHT });
    }
}