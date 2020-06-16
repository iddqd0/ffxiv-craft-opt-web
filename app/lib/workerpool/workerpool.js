/**
 * A web worker pool implementation for parallel execution of
 * computationally intensive operations. The pool will lazily grow up to its
 * given capacity. On saturation, messages will be queued up until a worker
 * from the pool becomes available.
 *
 *     let capacity = 3;
 *     let pool = new WorkerPool(capacity, "./worker.js");
 *     for (let i = 0; i < 10; i++) {
 *         pool.postMessage(msg, function(err, result) {
 *
 *         });
 *     }
 *
 * @param {number} capacity - The size of the pool. This will be the maximum
 * concurrency allowed.
 * @param {string} url - The web worker url. Workers are lazily created.
 *
 */
function WorkerPool(url, manager) {
    this.url = url;
    this.manager = manager;
    this.workers = Array();
    this.idle = Array();
}

WorkerPool.prototype.init = function (capacity, callback) {
    this.capacity = capacity;
    for (let i = 0; i <= this.capacity; i++) {
        this.spawn(callback);
    }
}

WorkerPool.prototype.wrapCallback = function (worker, callback) {
    let self = this;
    return function (e) {
        self.idle.unshift(worker);
        callback.call(null, worker, e, self.manager);
    };
}

WorkerPool.prototype.spawn = function (callback) {
    let self = this;

    if (this.workers.length < this.capacity) {
        let worker = new Worker(this.url);

        worker.onmessage = this.wrapCallback(worker, callback);
        worker.onerror = this.wrapCallback(worker, callback);

        this.workers.unshift(worker);
        this.idle.unshift(worker);
    }
}

WorkerPool.prototype.broadcast = function (message) {
    this.workers.forEach(function (worker) {
        worker.postMessage(message);
    });
}

WorkerPool.prototype.broadcastM = function (message, messageModifier) {
    message = messageModifier.call(null, message);

    this.workers.forEach(function (worker) {
        worker.postMessage(message);
    });
}
