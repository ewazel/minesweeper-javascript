const game = {
    init: function () {

        this.drawBoard();
        // TODO: do the rest of the game setup here (eg. add event listeners)
        this.initListeners();
        this.initMineCounter();
        this.initTimer();
    },

    drawBoard: function () {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const rows = parseInt(urlParams.get('rows'));
        const cols = parseInt(urlParams.get('cols'));
        const mineCount = parseInt(urlParams.get('mines'));
        const minePlaces = this.getRandomMineIndexes(mineCount, cols, rows);

        let gameField = document.querySelector(".game-field");
        this.setGameFieldSize(gameField, rows, cols);
        let cellIndex = 0
        for (let row = 0; row < rows; row++) {
            const rowElement = this.addRow(gameField);
            for (let col = 0; col < cols; col++) {
                this.addCell(rowElement, row, col, minePlaces.has(cellIndex));
                cellIndex++;
            }
        }
    },
    getRandomMineIndexes: function (mineCount, cols, rows) {
        const cellCount = cols * rows;
        let mines = new Set();
        do {
            mines.add(Math.round(Math.random() * (cellCount - 1)));
        } while (mines.size < mineCount && mines.size < cellCount);
        return mines;
    },
    setGameFieldSize: function (gameField, rows, cols) {
        gameField.style.width = (gameField.dataset.cellWidth * rows) + 'px';
        gameField.style.height = (gameField.dataset.cellHeight * cols) + 'px';
    },
    addRow: function (gameField) {
        gameField.insertAdjacentHTML(
            'beforeend',
            '<div class="row"></div>'
        );
        return gameField.lastElementChild;
    },
    addCell: function (rowElement, row, col, isMine) {
        rowElement.insertAdjacentHTML(
            'beforeend',
            `<div class="field${isMine ? ' mine' : ''}" 
                        data-row="${row}" 
                        data-col="${col}"></div>`);
    },

    initListeners: function() {
        const allCells = document.getElementsByClassName('field');

        for (cell of allCells) {
                cell.addEventListener('click', this.clickLeft);
                cell.addEventListener('click', this.checkAfterClick);
                cell.addEventListener('contextmenu', this.clickRight);
                cell.addEventListener('contextmenu', this.mineCountDown);
            }
    },

    clickLeft: function(evt) {
        if (!evt.target.classList.contains('mine') && !evt.target.classList.contains('flag')){
            evt.target.classList.add('open');
            game.countNeighbourMines(evt);
        } else if (evt.target.classList.contains('mine')) {
            evt.target.classList.add('boom');
        }
    },

    clickRight: function(evt) {
        evt.preventDefault();
        if (!evt.target.classList.contains('open') && !evt.target.classList.contains('boom')){
            evt.target.classList.toggle('flag');
        }
    },

    countNeighbourMines: function(evt){
        let row = parseInt(evt.target.getAttribute("data-row"));
        let col = parseInt(evt.target.getAttribute("data-col"));

        let rows = document.getElementsByClassName("row").length;
        let cols = document.getElementsByClassName("row")[0].childNodes.length;

        let mines = game.neighbourCounter(row, col, rows,cols);
        if (mines >0) {
            evt.target.textContent = mines.toString();
        } else {
            game.openNeighbours(row,col,rows, cols);
        }
    },

    neighbourCounter: function(row,col,rows,cols) {
        var neighMineCounter = 0;

        for (var neighRow = (row - 1); neighRow < (row+2); neighRow++){
            if (neighRow >= 0 && neighRow < rows) {
                for (var neighCol = (col -1); neighCol < (col+2); neighCol++){
                    if (neighCol >=0 && neighCol < cols){
                        if (!(neighCol == col && neighRow ==row)){
                          let neighCell = document.querySelector(`div[data-row='${neighRow}'][data-col='${neighCol}']`);
                            if (neighCell.classList.contains('mine')) {
                                neighMineCounter ++
                            }  
                        } 
                    }   
                }
            }
            
        }
        return neighMineCounter;

    },

    openNeighbours: function(row,col,rows,cols) {
        let toOpenArray = [];

        for (var neighRow = (row - 1); neighRow < (row+2); neighRow++){
            if (neighRow >= 0 && neighRow < rows) {
                for (var neighCol = (col -1); neighCol < (col+2); neighCol++){
                    if (neighCol >=0 && neighCol < cols){
                        let neighCell = document.querySelector(`div[data-row='${neighRow}'][data-col='${neighCol}']`);
                        if (!neighCell.classList.contains('open')) {
                            toOpenArray.push(neighCell);
                            }
                       }
                    }   
                }
        }
        console.log(toOpenArray);
        for (cell of toOpenArray) {
            cell.click()
        }
    },

    initMineCounter: function() {
        const mineCounter = document.getElementById("mine-left-counter");
        const totalMines = document.getElementsByClassName("mine").length;
        mineCounter.setAttribute("data-all-mines-count", new String(totalMines));
        mineCounter.value = mineCounter.getAttribute("data-all-mines-count");
    },

    mineCountDown: function(evt) {
        const mineCounter = document.getElementById("mine-left-counter");
        const isFLagged = evt.target.classList.contains('flag');
        if (mineCounter.value > 0) {
            if (isFLagged){
                mineCounter.value = (parseInt(mineCounter.value)-1).toString();
            } else {
                mineCounter.value = (parseInt(mineCounter.value)+1).toString();
           }
        }
    },

    checkAfterClick: function(evt) {
        const allCells = document.getElementsByClassName('field');
        let win = "";

        if (evt.target.classList.contains("boom")){
            win = false;
            game.checkWin(win, allCells);
        }

        for (cell of allCells) {
            if ((!cell.classList.contains("mine") && !cell.classList.contains("open"))) {
                win = false;
                break;
            }
            win = true;
        };
        if (win){
            game.checkWin(win, allCells);
        }
    },

    checkWin(win, allCells){
        console.log("youre in", win);
        game.stopListeners(allCells);
        game.revealMines();
        game.initTimer("stop");

        if (win) {
            game.printResult('VICTORY!');
        } else if (!win) {
            game.printResult('Game Over!');
        }
    },

    stopListeners: function(allCells) {
        for (cell of allCells) {
                cell.removeEventListener('click', this.clickLeft);
                cell.removeEventListener('click', this.checkWin);
                cell.removeEventListener('contextmenu', this.clickRight);
                cell.removeEventListener('contextmenu', this.mineCountDown);
            }
    },

    printResult: function(text) {
        const result = document.getElementById("result");
        result.textContent = text;
    },

    revealMines: function() {
        const mines = document.getElementsByClassName('mine');
        for (mine of mines) {
            mine.classList.add("boom");
            mine.classList.remove("flag");
        }
    },

    initTimer: function(mode="go") {
        const timer = document.getElementById('elapsed-time-counter');

        function tick() {
            startingValue = parseInt(timer.value);
            startingValue ++;
            timer.value = startingValue.toString();
            timeout = setTimeout(tick, 1000);
        }

        if (mode="stop" && window.timeout){
            clearTimeout(timeout);
        } else {
            tick();
        }
        
    },

};

game.init();