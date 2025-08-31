class TicTacToe {
    constructor(p1, p2 = '⭕') {
        this.p1 = p1;
        this.p2 = p2;
        this._playerTurn = false; 
        this._p1Board = 0;
        this._p2Board = 0;
        this.totalMoves = 0;
    }

    get activePlayer() {
        return this._playerTurn ? this.p2 : this.p1;
    }

    get victor() {
        const wins = [
            0b111000000, 
            0b000111000, 
            0b000000111, 
            0b100100100, 
            0b010010010, 
            0b001001001, 
            0b100010001, 
            0b001010100  
        ];

        for (let w of wins) {
            if ((this._p1Board & w) === w) return this.p1;
            if ((this._p2Board & w) === w) return this.p2;
        }

        return null;
    }

    play(position) {
        if (this.victor || position < 0 || position > 8) return -1;
        if ((this._p1Board | this._p2Board) & (1 << position)) return 0;

        if (this._playerTurn) this._p2Board |= 1 << position;
        else this._p1Board |= 1 << position;

        this._playerTurn = !this._playerTurn;
        this.totalMoves++;
        return 1;
    }

    displayBoard() {
        const board = [...Array(9)].map((_, i) => {
            const bit = 1 << i;
            return this._p1Board & bit ? '❌' : this._p2Board & bit ? '⭕' : i + 1;
        });

        return `${board[0]} | ${board[1]} | ${board[2]}
${board[3]} | ${board[4]} | ${board[5]}
${board[6]} | ${board[7]} | ${board[8]}`;
    }
}

module.exports = TicTacToe;
                                        
