const canvasDFS = document.getElementById('canvas-dfs');
const canvasBFS = document.getElementById('canvas-bfs');
const canvasBDS = document.getElementById('canvas-bds');
const refresh = document.getElementById('refresh');
const slider = document.getElementById('myRange');
const speedDisplay = document.getElementById('speed-display');

let ctxDFS = canvasDFS.getContext('2d');
let ctxBFS = canvasBFS.getContext('2d');
let ctxBDS = canvasBDS.getContext('2d');

const globalQueue = [];

const makeDelayedExec = (time) => {
    const queue = [];
    let onDrain = null;

    const delayedPrint = (cb) => {
        queue.push(cb);
    };

    delayedPrint.onDrain = (cb) => { onDrain = cb; };

    const intervalId = setInterval(() => {
        if (queue.length) {
            const fn = queue.shift();
            fn();
            globalQueue.push(intervalId);
        } else {
            clearInterval(intervalId);
            if (onDrain) onDrain();
        }
    }, time);

    return delayedPrint;
};

let speed = 0;

let delayedExecDfs = makeDelayedExec(speed);
let delayedExecBfs = makeDelayedExec(speed);
let delayedExecBds = makeDelayedExec(speed);

const POSITION_SIZE = 7;
const OPPOSITE_DIRECTION = {
    left: 'right',
    right: 'left',
    down: 'up',
    up: 'down'
};

class Maze {
    constructor(size, ctx, delayedExec) {
        this.delayedExec = delayedExec;
        this.ctx = ctx;
        this.grid = this.initializeGrid(size);
        this.start = [getRandomIndex(this.grid[0]), getRandomIndex(this.grid[0])];
        this.end = [getRandomIndex(this.grid[0]), getRandomIndex(this.grid[0])];
        this.size = size;
        this.nodesExplored = 0;

        this.grid[this.start[0]][this.start[1]].start = true;
        this.grid[this.end[0]][this.end[1]].end = true;
    }

    static clone(maze, ctx, delayedExec) {
        const clonedMaze = new Maze(maze.size, ctx);
        clonedMaze.grid = maze.grid;
        clonedMaze.start = maze.start;
        clonedMaze.end = maze.end;
        clonedMaze.delayedExec = delayedExec;
        return clonedMaze;
    }

    initializeGrid(size) {
        const newGrid = [];
        for (let i = 0; i < size; i++) {
            const row = [];
            for (let j = 0; j < size; j++) {
                row.push(new Node());
            }
            newGrid.push(row);
        }
        return newGrid;
    }

    set(row, col, val) {
        this.grid[row][col] = val;
    }

    paint() {
        // First pass: draw all paths
        for (let i = 0; i < this.grid.length; i++) {
            for (let j = 0; j < this.grid[0].length; j++) {
                let currNode = this.grid[i][j];
                let x = POSITION_SIZE * j * 2;
                let y = POSITION_SIZE * i * 2;

                this.ctx.fillStyle = '#44475a';
                this.ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);

                if (currNode.up === true) {
                    this.ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if (currNode.down === true) {
                    this.ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if (currNode.left === true) {
                    this.ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
                if (currNode.right === true) {
                    this.ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
            }
        }

        this.drawMarkers();
    }

    drawMarkers() {
        const r = POSITION_SIZE * 0.6;
        const pad = POSITION_SIZE + 4;

        // Start marker — pink glowing circle
        const [sr, sc] = this.start;
        const sx = POSITION_SIZE * sc * 2 + POSITION_SIZE / 2;
        const sy = POSITION_SIZE * sr * 2 + POSITION_SIZE / 2;

        // Clear area around start
        this.ctx.fillStyle = '#282a36';
        this.ctx.fillRect(sx - pad, sy - pad, pad * 2, pad * 2);

        this.ctx.save();
        this.ctx.shadowColor = '#ff79c6';
        this.ctx.shadowBlur = 6;
        this.ctx.fillStyle = '#ff79c6';
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, r, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Inner dot
        this.ctx.fillStyle = '#282a36';
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, r * 0.35, 0, Math.PI * 2);
        this.ctx.fill();

        // End marker — green glowing diamond
        const [er, ec] = this.end;
        const ex = POSITION_SIZE * ec * 2 + POSITION_SIZE / 2;
        const ey = POSITION_SIZE * er * 2 + POSITION_SIZE / 2;
        const d = POSITION_SIZE * 0.65;

        // Clear area around end
        this.ctx.fillStyle = '#282a36';
        this.ctx.fillRect(ex - pad, ey - pad, pad * 2, pad * 2);

        this.ctx.save();
        this.ctx.shadowColor = '#50fa7b';
        this.ctx.shadowBlur = 6;
        this.ctx.fillStyle = '#50fa7b';
        this.ctx.beginPath();
        this.ctx.moveTo(ex, ey - d);
        this.ctx.lineTo(ex + d, ey);
        this.ctx.lineTo(ex, ey + d);
        this.ctx.lineTo(ex - d, ey);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();

        // Inner diamond
        this.ctx.fillStyle = '#282a36';
        this.ctx.beginPath();
        const di = d * 0.35;
        this.ctx.moveTo(ex, ey - di);
        this.ctx.lineTo(ex + di, ey);
        this.ctx.lineTo(ex, ey + di);
        this.ctx.lineTo(ex - di, ey);
        this.ctx.closePath();
        this.ctx.fill();
    }

    paintCorrectPath(keys, color) {
        for (let key of keys) {
            const [currKey, dir] = key;
            this.delayedExec(() => {
                const [row, col] = this.keyToPosition(currKey);
                const x = POSITION_SIZE * col * 2;
                const y = POSITION_SIZE * row * 2;
                if (this.grid[row][col].start === false && this.grid[row][col].end === false) {
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'up') {
                    this.ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'down') {
                    this.ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'left') {
                    this.ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'right') {
                    this.ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
                this.drawMarkers();
            });
        }
    }

    generate() {
        const tree = new Set();
        tree.add('0,0');
        let edges = [];
        edges.push(...this.getEdges(0, 0));

        while (tree.size < this.grid.length ** 2) {
            const chosenIndex = getRandomIndex(edges);
            const chosenEdge = edges[chosenIndex];
            edges.splice(chosenIndex, 1);
            const [src, dir, dest] = chosenEdge;
            tree.add(dest);

            const srcPosition = this.keyToPosition(src);
            const srcNode = this.grid[srcPosition[0]][srcPosition[1]];
            srcNode[dir] = true;

            const destPosition = this.keyToPosition(dest);
            const destNode = this.grid[destPosition[0]][destPosition[1]];
            destNode[OPPOSITE_DIRECTION[dir]] = true;

            edges.push(...this.getEdges(...destPosition));

            edges = edges.filter((edge) => {
                const [edgeSrc, edgeDir, edgeDest] = edge;
                return !tree.has(edgeDest);
            });
        }
    }

    getEdges(row, col) {
        const edges = [];
        if (row - 1 >= 0) {
            edges.push([this.positionToKey(row, col), 'up', this.positionToKey(row - 1, col)]);
        }
        if (row + 1 < this.grid.length) {
            edges.push([this.positionToKey(row, col), 'down', this.positionToKey(row + 1, col)]);
        }
        if (col + 1 < this.grid[0].length) {
            edges.push([this.positionToKey(row, col), 'right', this.positionToKey(row, col + 1)]);
        }
        if (col - 1 >= 0) {
            edges.push([this.positionToKey(row, col), 'left', this.positionToKey(row, col - 1)]);
        }
        return edges;
    }

    getNeighbors(currKey) {
        const [row, col] = this.keyToPosition(currKey);
        const activeNeighbors = {};
        const currNode = this.grid[row][col];

        if (currNode.up === true) {
            activeNeighbors[this.positionToKey(row - 1, col)] = 'down';
        }
        if (currNode.down === true) {
            activeNeighbors[this.positionToKey(row + 1, col)] = 'up';
        }
        if (currNode.left === true) {
            activeNeighbors[this.positionToKey(row, col - 1)] = 'right';
        }
        if (currNode.right === true) {
            activeNeighbors[this.positionToKey(row, col + 1)] = 'left';
        }

        return activeNeighbors;
    }

    positionToKey(row, col) {
        return row + ',' + col;
    }

    keyToPosition(key) {
        return key.split(',').map(Number);
    }

    depthFirstSearch(currKey = this.start.join(','), targetKey = this.end.join(','), dir = null, visited = {}) {
        if (currKey in visited) {
            return [];
        }

        visited[currKey] = dir;
        this.nodesExplored++;

        this.delayedExec(() => {
            const [row, col] = this.keyToPosition(currKey);
            const x = POSITION_SIZE * col * 2;
            const y = POSITION_SIZE * row * 2;
            if (this.grid[row][col].start === false && this.grid[row][col].end === false) {
                this.ctx.fillStyle = "#6272a4";
                this.ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
            }
            if (dir === 'up') {
                this.ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
            }
            if (dir === 'down') {
                this.ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
            }
            if (dir === 'left') {
                this.ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
            }
            if (dir === 'right') {
                this.ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
            }
            this.drawMarkers();
        });

        if (currKey === targetKey) {
            return [[currKey, dir]];
        }

        const neighbors = this.getNeighbors(currKey);
        for (let neighborKey in neighbors) {
            const result = this.depthFirstSearch(neighborKey, targetKey, neighbors[neighborKey], visited);
            if (result.length > 0) {
                return [[currKey, dir], ...result];
            }
        }

        return [];
    }

    breadthFirstSearch(startKey = this.start.join(','), targetKey = this.end.join(','), visited = {}) {
        let queue = [[startKey, null]];
        let parents = { [startKey]: null };
        visited[startKey] = null;

        while (queue.length > 0) {
            const currKeyAndDir = queue.shift();
            const currKey = currKeyAndDir[0];
            const dir = currKeyAndDir[1];
            this.nodesExplored++;

            this.delayedExec(() => {
                const [row, col] = this.keyToPosition(currKey);
                const x = POSITION_SIZE * col * 2;
                const y = POSITION_SIZE * row * 2;
                if (this.grid[row][col].start === false && this.grid[row][col].end === false) {
                    this.ctx.fillStyle = "#6272a4";
                    this.ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'up') {
                    this.ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'down') {
                    this.ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'left') {
                    this.ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'right') {
                    this.ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
            });

            if (currKey === targetKey) {
                let path = [];
                let node = currKey;
                while (node !== null) {
                    if (node !== this.start.join(',')) {
                        path.unshift([node, visited[node]]);
                    }
                    node = parents[node];
                }
                return path;
            }

            const neighbors = this.getNeighbors(currKey);
            for (let neighbor in neighbors) {
                if (!(neighbor in visited)) {
                    queue.push([neighbor, neighbors[neighbor]]);
                    parents[neighbor] = currKey;
                    visited[neighbor] = neighbors[neighbor];
                }
            }
        }
    }

    bidirectionalSearch(startKey = this.start.join(','), targetKey = this.end.join(',')) {
        const startVisited = {};
        const startQueue = [[startKey, null]];
        startVisited[startKey] = null;

        const endVisited = {};
        const endQueue = [[targetKey, null]];
        endVisited[targetKey] = null;

        let currQueue = startQueue;
        let currVisited = startVisited;

        let startParents = { [startKey]: null };
        let endParents = { [targetKey]: null };
        let currParents = startParents;

        while (currQueue.length > 0) {
            const currKeyAndDir = currQueue.shift();
            const currKey = currKeyAndDir[0];
            const dir = currKeyAndDir[1];
            this.nodesExplored++;

            this.delayedExec(() => {
                const [row, col] = this.keyToPosition(currKey);
                const x = POSITION_SIZE * col * 2;
                const y = POSITION_SIZE * row * 2;
                if (this.grid[row][col].start === false && this.grid[row][col].end === false) {
                    this.ctx.fillStyle = "#6272a4";
                    this.ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'up') {
                    this.ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'down') {
                    this.ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'left') {
                    this.ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
                if (dir === 'right') {
                    this.ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
            });

            const neighbors = this.getNeighbors(currKey);
            for (let neighbor in neighbors) {
                if (!(neighbor in currVisited)) {
                    currQueue.push([neighbor, neighbors[neighbor]]);
                    currParents[neighbor] = currKey;
                    currVisited[neighbor] = neighbors[neighbor];
                }
            }

            if (currKey in startVisited && currKey in endVisited) {
                let startPath = [];
                let endPath = [];
                let startNode = currKey;
                let endNode = currKey;

                while (startNode !== null) {
                    if (startNode !== this.start.join(',')) {
                        startPath.unshift([startNode, startVisited[startNode]]);
                    }
                    startNode = startParents[startNode];
                }

                while (endNode !== null) {
                    if (endNode !== this.end.join(',')) {
                        endPath.unshift([endNode, endVisited[endNode]]);
                    }
                    endNode = endParents[endNode];
                }

                return startPath.concat(endPath);
            }
            currVisited = currVisited === startVisited ? endVisited : startVisited;
            currQueue = currQueue === startQueue ? endQueue : startQueue;
            currParents = currParents === startParents ? endParents : startParents;
        }
    }
}

class Node {
    constructor() {
        this.up = false;
        this.down = false;
        this.left = false;
        this.right = false;
        this.start = false;
        this.end = false;
    }
}

const getRandomIndex = (arr) => {
    return Math.floor(Math.random() * arr.length);
};

function updateStats(maze, path, solveTime, prefix) {
    document.getElementById('explored-' + prefix).textContent = maze.nodesExplored;
    document.getElementById('path-' + prefix).textContent = path ? path.length : '--';
    document.getElementById('time-' + prefix).textContent = solveTime.toFixed(2) + 'ms';
    document.getElementById('stats-' + prefix).classList.add('solved');
    // Remove any previous winner highlight
    document.querySelector('.card[data-algo="' + prefix + '"]').classList.remove('winner');
}

function highlightWinner(times) {
    let minTime = Infinity;
    let winnerPrefix = null;
    for (const [prefix, time] of Object.entries(times)) {
        if (time < minTime) {
            minTime = time;
            winnerPrefix = prefix;
        }
    }
    if (winnerPrefix) {
        document.querySelector('.card[data-algo="' + winnerPrefix + '"]').classList.add('winner');
    }
}

function runMaze() {
    for (let i = 0; i < globalQueue.length; i++) {
        clearInterval(globalQueue[i]);
    }
    globalQueue.length = 0;

    ctxDFS.clearRect(0, 0, canvasDFS.width, canvasDFS.height);
    ctxBFS.clearRect(0, 0, canvasBFS.width, canvasBFS.height);
    ctxBDS.clearRect(0, 0, canvasBDS.width, canvasBDS.height);

    document.getElementById('stats-dfs').classList.remove('solved');
    document.getElementById('stats-bfs').classList.remove('solved');
    document.getElementById('stats-bds').classList.remove('solved');

    delayedExecDfs = makeDelayedExec(speed);
    delayedExecBfs = makeDelayedExec(speed);
    delayedExecBds = makeDelayedExec(speed);

    let mazeDFS = new Maze(40, ctxDFS, delayedExecDfs);
    mazeDFS.generate();
    let mazeBFS = Maze.clone(mazeDFS, ctxBFS, delayedExecBfs);
    let mazeBDS = Maze.clone(mazeDFS, ctxBDS, delayedExecBds);

    mazeDFS.paint();
    mazeBFS.paint();
    mazeBDS.paint();

    let t0, t1;

    t0 = performance.now();
    let dfsPath = mazeDFS.depthFirstSearch();
    t1 = performance.now();
    const dfsTime = t1 - t0;

    t0 = performance.now();
    let bfsPath = mazeBFS.breadthFirstSearch();
    t1 = performance.now();
    const bfsTime = t1 - t0;

    t0 = performance.now();
    let bdsPath = mazeBDS.bidirectionalSearch();
    t1 = performance.now();
    const bdsTime = t1 - t0;

    updateStats(mazeDFS, dfsPath, dfsTime, 'dfs');
    updateStats(mazeBFS, bfsPath, bfsTime, 'bfs');
    updateStats(mazeBDS, bdsPath, bdsTime, 'bds');

    mazeDFS.paintCorrectPath(dfsPath, '#bd93f9');
    mazeBFS.paintCorrectPath(bfsPath, '#bd93f9');
    mazeBDS.paintCorrectPath(bdsPath, '#bd93f9');

    // Highlight winner after all animation queues drain
    let drained = 0;
    const onAllDrained = () => {
        drained++;
        if (drained === 3) {
            highlightWinner({ dfs: dfsTime, bfs: bfsTime, bds: bdsTime });
        }
    };
    delayedExecDfs.onDrain(onAllDrained);
    delayedExecBfs.onDrain(onAllDrained);
    delayedExecBds.onDrain(onAllDrained);
}

// Initial run
runMaze();

// Controls
refresh.onclick = runMaze;

slider.oninput = function () {
    speed = this.value;
    speedDisplay.textContent = this.value + 'ms';
};
