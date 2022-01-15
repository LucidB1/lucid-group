const APP = new Vue({
    el: '#app',
    data: {
        show: false,
        source: null,
        players: [],
   
    },
    methods: {
        updateHud(players, source) {
            this.show = true;
            this.players = players;
            this.source = source;
        },
        setShow(toggle) {
            this.show = toggle
        }
    },
    computed: {
        
    },
})

    window.addEventListener("message", function (event) {
        switch (event.data.action) {
            case "update":
                APP.updateHud(event.data.players, event.data.source);
                break;
         
            case "close":
                APP.setShow(false);
                break;
           
        }
    });