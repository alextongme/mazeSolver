// const sum = (array) => {
//   if (array.length === 0) {
//     return 0
//   }
//   const ans = array[0] + sum(array.slice(1));
//   return ans;
// };

// // sum([2, 4, 5, 1, 3]); // 9




// const makeDelayedExec = () => {
//   const queue = [];

//   const delayedPrint = (cb) => {
//     queue.push(cb);
//   };

//   const intervalId = setInterval(() => {
//     if (queue.length) {
//       const fn = queue.shift();
//       fn();
//     } else {
//       clearInterval(intervalId);
//     }
//   }, 500);

//   return delayedPrint
// };


// const delayedExec = makeDelayedExec();

// delayedExec(() => {
//   console.log('same');
//   console.log('time');
// });


// delayedExec(() => {
//   console.log('kinda');
//   console.log('late');
// });



// JavaScript
//   -a closure is a fn that references variables that are declared outside of it


// const makeAdder = (x) => {
//   return (y) => {
//     return x + y;
//   };
// };



// makeAdder(10)(2);

// const addTen = makeAdder(10);

// console.log(addTen(2)); // 12
// console.log(addTen(5)); // 15


// const addHundo = makeAdder(100);
// console.log(addHundo(1)); // 101
// console.log(addHundo(2)); // 102
// console.log(addTen(3)); //13

// const zap = () => {
//   let i = 0;
//   return () => {
//     i++;
//     console.log(i);
//   };
// }


// const thing = zap();


// thing(); // 1
// thing(); // 2
// thing(); // 3

const g = {
  a: ['b', 'c'],
  b: ['d'],
  c: ['x'],
  d: ['e'],
  e: [],
  x: []
}

// a - b - d - e
// |
// c - x

const dfs = (graph, curr, target) => {
  if (curr === target) {
    return [ curr ];
  }

  const neighbors = graph[curr];
  for (let neighbor of neighbors) {
    const output = dfs(graph, neighbor, target)
    if (output.length > 0) 
      return [curr, ...output];
  }
  return [];
}

console.log(dfs(g, 'a', 'x')) // [a, c, x]

// TODO:
//   - refactor the maze.dfs fn to return the array representing the winning path
//   - color the correct nodes/edges of that winning path