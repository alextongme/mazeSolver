// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
const canvasDFS = document.getElementById('canvas-dfs');
const canvasBFS = document.getElementById('canvas-bfs');
const canvasBDS = document.getElementById('canvas-bds');
const refresh = document.getElementById('refresh');
const speedText = document.getElementById('speed');

const incrementSpeed = document.getElementById('increment');
const decrementSpeed = document.getElementById('decrement');

let ctxDFS = canvasDFS.getContext('2d');
let ctxBFS = canvasBFS.getContext('2d');
let ctxBDS = canvasBDS.getContext('2d');

const makeDelayedExec = (time) => {
    const queue = [];
  
    const delayedPrint = (cb) => {
      queue.push(cb);
    };
  
    const intervalId = setInterval(() => {
      if (queue.length) {
        const fn = queue.shift();
        fn();
        refresh.setAttribute('disabled', true);
      } else {
        refresh.removeAttribute('disabled');
        clearInterval(intervalId);
      }
    }, time);
  
    return delayedPrint;
};

let speed = 10;

speedText.innerHTML = speed;

let delayedExecDfs = makeDelayedExec(speed);
let delayedExecBfs = makeDelayedExec(speed);
let delayedExecBds = makeDelayedExec(speed);

const POSITION_SIZE = 5;
const OPPOSITE_DIRECTION = {
    left: 'right',
    right: 'left',
    down: 'up',
    up: 'down'
};


class Maze {
    constructor(size, ctx, delayedExec) {
        this.delayedExec = delayedExec
        this.ctx = ctx
        this.grid = this.initializeGrid(size)
        this.start = [getRandomIndex(this.grid[0]), getRandomIndex(this.grid[0])];
        this.end = [getRandomIndex(this.grid[0]), getRandomIndex(this.grid[0])];
        this.size = size;

        this.grid[this.start[0]][this.start[1]].start = true;
        this.grid[this.end[0]][this.end[1]].end = true;
        
    };

    static clone(maze, ctx, delayedExec) {
        const clonedMaze = new Maze(maze.size, ctx)
        clonedMaze.grid = maze.grid
        clonedMaze.start = maze.start
        clonedMaze.end = maze.end
        clonedMaze.delayedExec = delayedExec
        return clonedMaze
    }

    initializeGrid(size) {
        const newGrid = [];

        for(let i = 0; i < size; i++) {
            const row = [];
            for(let j = 0; j < size; j++) {
                row.push(new Node())
            }
            newGrid.push(row);
        };
        
        return newGrid;
    };

    set(row, col, val) {
        this.grid[row][col] = val
    }

    paint() {
        for(let i = 0; i < this.grid.length; i++) {
            for(let j = 0; j < this.grid[0].length; j++) {

                    let currNode = this.grid[i][j];
                    if(currNode.start === true) {
                        this.ctx.fillStyle = '#FFFF00';
                    } else if (currNode.end === true) {
                        this.ctx.fillStyle = '#39ff14';
                    } else {
                        this.ctx.fillStyle = '#eae2b7';
                    }
    
                    let x = POSITION_SIZE * j * 2;
                    let y = POSITION_SIZE * i * 2;
                    this.ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);

                    if(currNode.up === true) {
                        this.ctx.fillStyle = '#eae2b7';
                        this.ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                    }
                    if(currNode.down === true) {
                        this.ctx.fillStyle = '#eae2b7';
                        this.ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                    }
                    if(currNode.left === true) {
                        this.ctx.fillStyle = '#eae2b7';
                        this.ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                    }
                    if(currNode.right === true) {
                        this.ctx.fillStyle = '#eae2b7';
                        this.ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                    }
            }
        }
    }

    paintCorrectPath(keys, color) { // keys = {  '1,0':'left',    }
        for(let key of keys) {
            const [currKey, dir] = key;
            this.delayedExec(() => {
                const [row, col] = this.keyToPosition(currKey);
                const x = POSITION_SIZE * col * 2;
                const y = POSITION_SIZE * row * 2;
                if (this.grid[row][col].start === false && this.grid[row][col].end === false) {
                    this.ctx.fillStyle = color;
                    this.ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
                } 
                if(dir === 'up') { 
                    this.ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'down') {
                    this.ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'left') {
                    this.ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'right') {
                    this.ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
            })
        }
    }

    // https://docs.google.com/drawings/d/1dbx2Tohdpm7Wt8C6eBbP1Jqk89rAiVmKONdLA30c9YY/edit?usp=sharing
    generate() { 
        // prims algoritm, 
        // takes a graph and creates a tree within the graph that spans all nodes, but only SOME edges
        const tree = new Set();
        tree.add('0,0');
        let edges = []; 
        // at any point in time, edges will contains edges where the SOURCE is in the tree but the DEST
        // is not in the tree
        edges.push(...this.getEdges(0, 0));
        
        // while the tree does not contain every node
        while(tree.size < this.grid.length**2) {
            const chosenIndex = getRandomIndex(edges);
            const chosenEdge = edges[chosenIndex];
            edges.splice(chosenIndex, 1);

            const [ src, dir, dest ] = chosenEdge;
          
            tree.add(dest);

            const srcPosition = this.keyToPosition(src);
            const srcNode = this.grid[srcPosition[0]][srcPosition[1]];
            srcNode[dir] = true;
            
            const destPosition = this.keyToPosition(dest);
            const destNode = this.grid[destPosition[0]][destPosition[1]];
            destNode[OPPOSITE_DIRECTION[dir]] = true;

            edges.push(...this.getEdges(...destPosition));

            // remove the edges of the edges array whose destination is ALREADY
            // in the tree
            edges = edges.filter((edge) => {
                const [ edgeSrc, edgeDir, edgeDest ] = edge;
                if(tree.has(edgeDest)) {
                    return false;
                }
                return true;
            });
        }
    }

    // https://docs.google.com/drawings/d/1a0sk5EG8xGBJNUYUigDf6gBdIhwUuU6OJKhQFCjGBJc/edit?usp=sharing
    getEdges(row, col) {
        const edges = []
        if (row - 1 >= 0) {
            edges.push([this.positionToKey(row, col), 'up', this.positionToKey(row - 1, col)])
        }

        if (row + 1 < this.grid.length) {
            edges.push([this.positionToKey(row, col), 'down', this.positionToKey(row + 1, col)])
        }

        if (col + 1 < this.grid[0].length) {
            edges.push([this.positionToKey(row, col), 'right', this.positionToKey(row, col + 1)])
        }

        if (col - 1 >= 0) {
            edges.push([this.positionToKey(row, col), 'left', this.positionToKey(row, col - 1)])
        }

        return edges
    }

    getNeighbors(currKey) {
        const [row, col] = this.keyToPosition(currKey);
        const activeNeighbors = {};
        const currNode = this.grid[row][col];

        if(currNode.up === true) {
            activeNeighbors[this.positionToKey(row - 1, col)] = 'down';
        }
        if(currNode.down === true) {
            activeNeighbors[this.positionToKey(row + 1, col)] = 'up';
        }
        if(currNode.left === true) {
            activeNeighbors[this.positionToKey(row, col - 1)] = 'right';
        }
        if(currNode.right === true) {
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

    depthFirstSearch(currKey = this.start.join(','), targetKey = this.end.join(','), dir = null, visited = {} ) {
        if (currKey in visited) {
            return [];
        }

        visited[currKey] = dir;

        this.delayedExec(() => {
            const [row, col] = this.keyToPosition(currKey);
            const x = POSITION_SIZE * col * 2;
            const y = POSITION_SIZE * row * 2;
            if(this.grid[row][col].start === false && this.grid[row][col].end === false) {
                this.ctx.fillStyle = "#f77f00";
                this.ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
            }
            if(dir === 'up') { 
                this.ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
            }
            if(dir === 'down') {
                this.ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
            }
            if(dir === 'left') {
                this.ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
            }
            if(dir === 'right') {
                this.ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
            }
        })

        if (currKey === targetKey) {
            return [[currKey, dir]];
        }
        
        const neighbors = this.getNeighbors(currKey);
        for (let neighborKey in neighbors) { // {  '1,0':'left',    }
            const result = this.depthFirstSearch(neighborKey, targetKey, neighbors[neighborKey], visited);
            if (result.length > 0) {
                return [[currKey, dir], ...result];
            }
        }

        return [];
    }

    breadthFirstSearch(startKey = this.start.join(','), targetKey = this.end.join(','), visited = {}) {
        let queue = [[startKey, null]];
        let parents = {[startKey]: null };
        visited[startKey] = null;

        while(queue.length > 0) {
            const currKeyAndDir = queue.shift();
            const currKey = currKeyAndDir[0];
            const dir = currKeyAndDir[1];
            
            this.delayedExec(() => {
                const [row, col] = this.keyToPosition(currKey);
                const x = POSITION_SIZE * col * 2;
                const y = POSITION_SIZE * row * 2;
                if(this.grid[row][col].start === false && this.grid[row][col].end === false) {
                    this.ctx.fillStyle = "#f77f00";
                    this.ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
                }

                if(dir === 'up') { 
                    this.ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'down') {
                    this.ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'left') {
                    this.ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'right') {
                    this.ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
            });
           

            if(currKey === targetKey) {
                let path = []
                let node = currKey
                while(node !== null) {
                    if(node !== this.start.join(',')) {
                        path.unshift([node, visited[node]])
                    }
                    node = parents[node]
                }
                return path
            };

            

            const neighbors = this.getNeighbors(currKey);
            for(let neighbor in neighbors) {
                if(!(neighbor in visited)) {
                    queue.push([neighbor, neighbors[neighbor]])
                    parents[neighbor] = currKey
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

        let startParents = {[startKey]: null };
        let endParents = {[targetKey]: null };
        let currParents = startParents;

        while(currQueue.length > 0) {
            const currKeyAndDir = currQueue.shift();
            const currKey = currKeyAndDir[0];
            const dir = currKeyAndDir[1];

            this.delayedExec(() => {
                const [row, col] = this.keyToPosition(currKey);
                const x = POSITION_SIZE * col * 2;
                const y = POSITION_SIZE * row * 2;
                if(this.grid[row][col].start === false && this.grid[row][col].end === false) {
                    this.ctx.fillStyle = "#f77f00";
                    this.ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
                }

                if(dir === 'up') { 
                    this.ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'down') {
                    this.ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'left') {
                    this.ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'right') {
                    this.ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
            });

            const neighbors = this.getNeighbors(currKey);
            for(let neighbor in neighbors) {
                if(!(neighbor in currVisited)) {
                    currQueue.push([neighbor, neighbors[neighbor]])
                    currParents[neighbor] = currKey
                    currVisited[neighbor] = neighbors[neighbor];
                }
            }

            if (currKey in startVisited && currKey in endVisited) {
                let startPath = [];
                let endPath = [];
                let startNode = currKey;
                let endNode = currKey;

                while(startNode !== null) {
                    if(startNode !== this.start.join(',')) {
                        startPath.unshift([startNode, startVisited[startNode]])
                    }
                    startNode = startParents[startNode]
                }

                while(endNode !== null) {
                    if(endNode !== this.end.join(',')) {
                        endPath.unshift([endNode, endVisited[endNode]])
                    }
                    endNode = endParents[endNode]
                }

                return startPath.concat(endPath);
            }
            currVisited = currVisited === startVisited ? endVisited : startVisited;
            currQueue = currQueue === startQueue ? endQueue : startQueue;
            currParents = currParents === startParents ? endParents : startParents;
        }
    }
};

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
    return Math.floor(Math.random() * arr.length)
};

let mazeDFS = new Maze(40, ctxDFS, delayedExecDfs);
mazeDFS.generate()
let mazeBFS = Maze.clone(mazeDFS, ctxBFS, delayedExecBfs)
let mazeBDS = Maze.clone(mazeDFS, ctxBDS, delayedExecBds)

mazeDFS.paint();
mazeBFS.paint();
mazeBDS.paint();

let dfsPath = mazeDFS.depthFirstSearch();
let bfsPath = mazeBFS.breadthFirstSearch();
let bdsPath = mazeBDS.bidirectionalSearch();

mazeDFS.paintCorrectPath(dfsPath, '#d62828');
mazeBFS.paintCorrectPath(bfsPath, '#d62828');
mazeBDS.paintCorrectPath(bdsPath, '#d62828');

refresh.onclick = function() {
    ctxDFS.clearRect(0, 0, canvasDFS.width, canvasDFS.height);
    ctxBFS.clearRect(0, 0, canvasBFS.width, canvasBFS.height);
    ctxBDS.clearRect(0, 0, canvasBDS.width, canvasBDS.height);
    delayedExecDfs = makeDelayedExec(speed);
    delayedExecBfs = makeDelayedExec(speed);
    delayedExecBds = makeDelayedExec(speed);

    mazeDFS = new Maze(40, ctxDFS, delayedExecDfs);
    mazeDFS.generate()
    mazeBFS = Maze.clone(mazeDFS, ctxBFS, delayedExecBfs)
    mazeBDS = Maze.clone(mazeDFS, ctxBDS, delayedExecBds)
    
    mazeDFS.paint();
    mazeBFS.paint();
    mazeBDS.paint();

    dfsPath = mazeDFS.depthFirstSearch();
    bfsPath = mazeBFS.breadthFirstSearch();
    bdsPath = mazeBDS.bidirectionalSearch();

    mazeDFS.paintCorrectPath(dfsPath, '#d62828');
    mazeBFS.paintCorrectPath(bfsPath, '#d62828');
    mazeBDS.paintCorrectPath(bdsPath, '#d62828');
}

incrementSpeed.onclick = function() {
    speed += 1;
    speedText.innerHTML = speed;
}

decrementSpeed.onclick = function() {
    if (speed > 0) {
        speed -= 1;
        speedText.innerHTML = speed;
    }
}
