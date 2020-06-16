function Manager($timeout) {
    this.$timeout = $timeout;
    this.pool = new WorkerPool('js/solver/worker.js', this);
    this.stopRequested = false;
}

Manager.prototype.init = function (capacity) {
    this.capacity = capacity;
    this.pool.init(this.capacity, this.callback);
}

Manager.prototype.start = function (settings, progress, success, error) {
    this.settings = settings;

    if (settings.recipe.startQuality === undefined) {
        settings.recipe = angular.copy(settings.recipe);
        settings.recipe.startQuality = 0;
    }

    let worker_settings = angular.copy(settings);

    worker_settings.solver.generations = Math.ceil(settings.solver.generations / 4);
    worker_settings.solver.population = Math.ceil(settings.solver.population / 4);
    worker_settings.maxMontecarloRuns = Math.ceil(settings.maxMontecarloRuns / 4);

    this.callbacks = {
        progress: progress,
        success: success,
        error: error
    };


    this.pool.broadcastM({start: worker_settings}, function (message) {
        if (!message.start.specifySeed) {
            message.start.seed = Math.floor(Math.random(1, 10000000));
        }
        return message;
    });
}

Manager.prototype.callback = function (worker, e, manager) {
    let data = e.data;

    if (data.progress) {
        manager.$timeout(function () {
            manager.callbacks.progress(data.progress);
        });
        if (!manager.stopRequested && data.progress.generationsCompleted < data.progress.maxGenerations) {
            worker.postMessage('rungen');
        } else {
            worker.postMessage('finish');
        }
    } else if (data.success) {
        manager.$timeout(function () {
            manager.callbacks.success(data.success);
        });
    } else if (data.error) {
        manager.$timeout(function () {
            manager.callbacks.error(data.error);
        });
    } else {
        console.error('unexpected message from solver worker: %O', data);
        manager.$timeout(function () {
            manager.callbacks.error({log: '', error: 'unexpected message from solver worker: ' + data});
        });
    }
};

Manager.prototype.stop = function () {
    this.stopRequested = true;
    this.pool.broadcast('stop');
}

Manager.prototype.resume = function () {
    this.stopRequested = false;
    this.pool.broadcast('resume');
}