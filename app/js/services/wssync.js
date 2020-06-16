(function () {
    'use strict';

    angular
        .module('ffxivCraftOptWeb.services.wssync', ['ffxivCraftOptWeb.services.profile'])
        .service('_wsSync', wsSync);

    function wsSync($rootScope, _profile) {
        this.profile = _profile;
        this.$rootScope = $rootScope;
    }

    wsSync.$inject = ['$rootScope', '_profile'];

    wsSync.prototype.useStorage = function (storage) {
        if (storage === undefined || storage === null) {
            throw new TypeError('storage may not be undefined or null');
        }
        this.storage = storage;
    };

    wsSync.prototype.connectWS = function () {
        try {
            let webSocket = new WebSocket("ws://localhost:8181");

            webSocket.onmessage = function (event) {
                let data = {};

                try {
                    data = JSON.parse(event.data);
                } catch (e) {
                    console.error('JSON parsing error', e);
                    return;
                }

                if (data.error) {
                    console.error('error from WS', data.error);
                    return;
                }

                for (let key in data) {
                    if (data.hasOwnProperty(key)) {
                        let crafter = data[key];

                        this.profile.crafterStats[crafter.className] = {
                            level: crafter.level,
                            craftsmanship: crafter.craftsmanship,
                            control: crafter.control,
                            cp: crafter.cp,
                            specialist: crafter.specialist,
                            actions: ["basicSynth"]
                        };

                        this.$rootScope.$broadcast('profile.updated', crafter.className);
                    }
                }

                this.$rootScope.$broadcast('simulation.needs.update');
            }.bind(this);

            webSocket.onerror = function (event) {
                console.error('WS Error', event);
            }

            return webSocket;
        } catch (e) {
            console.error('WS init error', e);
        }

        return null;
    }

    wsSync.prototype.start = function () {
        let webSocket = this.connectWS();

        setInterval(function () {
            if (webSocket && webSocket.readyState === WebSocket.OPEN) {
                webSocket.send('UPDATE');
            } else {
                webSocket = this.connectWS();
            }
        }.bind(this), 2000);
    };
})();

