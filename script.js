// https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ctx.fillStyle = 'green';
// ctx.fillRect(0, 80, 200, 100);

const makeDelayedExec = (time) => {
    const queue = [];
  
    const delayedPrint = (cb) => {
      queue.push(cb);
    };
  
    const intervalId = setInterval(() => {
      if (queue.length) {
        const fn = queue.shift();
        fn();
      } else {
        clearInterval(intervalId);
      }
    }, time);
  
    return delayedPrint;
};

const delayedExec = makeDelayedExec(50);

const POSITION_SIZE = 50;
const OPPOSITE_DIRECTION = {
    left: 'right',
    right: 'left',
    down: 'up',
    up: 'down'
};

class Maze {
    constructor(size) { // size # rows / # cols
        this.grid = this.initializeGrid(size)
        this.generate();
        this.start = [0, 0];
        this.end = [size - 1, size - 1];
    };

    initializeGrid(size) {
        const newGrid = [];

        for(let i = 0; i < size; i++) {
            const row = [];
            for(let j = 0; j < size; j++) {
                row.push(new Node())
            }
            newGrid.push(row);
        };
        
        newGrid[0][0].start = true;
        newGrid[size - 1][size - 1].end = true;
        
        return newGrid;
    };

    set(row, col, val) {
        this.grid[row][col] = val
    }

    paint() {
        for(let i = 0; i < this.grid.length; i++) {
            for(let j = 0; j < this.grid[0].length; j++) {
                    // color node
                    let currNode = this.grid[i][j];
                    if(currNode.start === true) {
                        ctx.fillStyle = 'blue';
                    } else if (currNode.end === true) {
                        ctx.fillStyle = 'orange';
                    } else {
                        ctx.fillStyle = 'white';
                    }
    
                    let x = POSITION_SIZE * j * 2;
                    let y = POSITION_SIZE * i * 2;
                    ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
                    
                    // color edges
                    if(currNode.up === true) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                    }
                    if(currNode.down === true) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                    }
                    if(currNode.left === true) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                    }
                    if(currNode.right === true) {
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                    }
            }
        }
    }
    
    // myMaze.paintKeys(visitedKeys, 'red');
    paintVisited(keys, color) { // keys = {  '1,0':'left',    }
        for (let key in keys) {
            const [row, col] = this.keyToPosition(key);
            const x = POSITION_SIZE * col * 2;
            const y = POSITION_SIZE * row * 2;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
            
            if(keys[key] === 'up') {
                ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
            }
            if(keys[key] === 'down') {
                ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
            }
            if(keys[key] === 'left') {
                ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
            }
            if(keys[key] === 'right') {
                ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
            }
        }
    }

    paintCorrectPath(keys, color) { // keys = {  '1,0':'left',    }
        for(let key of keys) {
            const [currKey, dir] = key;
            delayedExec(() => {
                const [row, col] = this.keyToPosition(currKey);
                const x = POSITION_SIZE * col * 2;
                const y = POSITION_SIZE * row * 2;
                if (this.grid[row][col].start === false && this.grid[row][col].end === false) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
                } 
                if(dir === 'up') { 
                    ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'down') {
                    ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'left') {
                    ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
                }
                if(dir === 'right') {
                    ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
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
    // getNeighbors('1,1'); => {  '1,0':'left',    }


    // .getNeighbors(1, 1); // [ [0, 1], [2, 1]]
    positionToKey(row, col) {
        return row + ',' + col;
    }

    keyToPosition(key) {
        return key.split(',').map(Number);
    }

    depthFirstSearch(currKey, targetKey, dir = null, visited = {} ) {
        if (currKey in visited) {
            return [];
        }

        // visited.add(currKey);
        visited[currKey] = dir;

        //call delayedExec
        delayedExec(() => {
            const [row, col] = this.keyToPosition(currKey);
            const x = POSITION_SIZE * col * 2;
            const y = POSITION_SIZE * row * 2;
            if(this.grid[row][col].start === false && this.grid[row][col].end === false) {
                ctx.fillStyle = "red";
                ctx.fillRect(x, y, POSITION_SIZE, POSITION_SIZE);
            }
            if(dir === 'up') { 
                ctx.fillRect(x, y - POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
            }
            if(dir === 'down') {
                ctx.fillRect(x, y + POSITION_SIZE, POSITION_SIZE, POSITION_SIZE);
            }
            if(dir === 'left') {
                ctx.fillRect(x - POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
            }
            if(dir === 'right') {
                ctx.fillRect(x + POSITION_SIZE, y, POSITION_SIZE, POSITION_SIZE);
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
};
// if (key in obj)
//  { '1,0': 'right' }

// .neighbors(0, 0)
//   [ [ '0,0', 'right', '0,1'], [ '0,0', 'down', '1,0' ]]

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

const myMaze = new Maze(12);
myMaze.paint(); // 
const correctPath = myMaze.depthFirstSearch('0,0', '11,11');
console.log(correctPath)
myMaze.paintCorrectPath(correctPath, 'green');
// myMaze.paintVisited(visited, 'red');