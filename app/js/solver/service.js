(function () {
    'use strict';

    angular
        .module('ffxivCraftOptWeb.services.solver', [])
        .service('_solver', SolverService);

    function SolverService($timeout) {
        this.manager = new Manager($timeout);
    }

    SolverService.$inject = ['$timeout'];

    SolverService.prototype.init = function (capacity) {
        this.manager.init(capacity);
    };

    SolverService.prototype.start = function (settings, progress, success, error) {
        this.manager.start(settings, progress, success, error);
    };

    SolverService.prototype.stop = function () {
        this.manager.stop();
    };

    SolverService.prototype.resume = function () {
        this.manager.resume();
    };
})();
