function initBoard(rows = 15, cols = 15, randomize = false) {
    const board = [];
    for (let i = 0;i<rows;i++) {
        const row = [];
        for (let j = 0;j<cols;j++) {
            row.push(randomize ? (Math.random() < 0.3 ? 1 : 0) : 0);
        }
        board.push(row);
    }
    return board;
}

function resizeBoard(newRows,newCols,board) {
    let rows = board.length;
    let cols = board[0]?.length || 0;
    if (rows==newRows && cols==newCols) return; // edge case

    // ROWS
    if (rows<newRows) for (let i = 0;i<newRows-rows;i++) board.push(new Array(cols).fill(0));
    else if (rows>newRows) board.splice(newRows);

    // COLS
    rows = board.length;
    for (let i = 0;i<rows;i++) {
        if (cols<newCols) for (let j = 0;j<newCols-cols;j++) board[i].push(0);
        else if (cols>newCols) board[i].splice(newCols);
    }
    return board;
}

function gameOfLife(board) {
    const n = board.length;
    const m = board[0].length;
    const changePos = [];

    const get = (i,j)=>{
        return i>=0 && j>=0 && i<n && j<m ? board[i][j] : 0;
    }
    
    for (let i = 0;i<n;i++) {
        for (let j = 0;j<m;j++) {
            const adjMap = [
                get(i-1,j-1),
                get(i-1,j),
                get(i-1,j+1),
                get(i,j-1),
                get(i,j+1),
                get(i+1,j-1),
                get(i+1,j),
                get(i+1,j+1),
            ];

            const adjCount = adjMap.reduce((sum,val) => sum+val,0);

            if (board[i][j] === 1 && (adjCount<2 || adjCount>3)) changePos.push([i,j]);
            else if (board[i][j] === 0 && adjCount === 3) changePos.push([i,j]);
        }
    }

    for (const [i,j] of changePos) board[i][j] = board[i][j] === 1 ? 0 : 1;

    return board;
}

module.exports = {gameOfLife,resizeBoard,initBoard};