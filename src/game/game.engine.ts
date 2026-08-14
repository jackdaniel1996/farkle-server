import { GamePlayer, GameState } from "./types";


export class GameEngine {
    public state: GameState;

    constructor(players: GamePlayer[]) {
        this.state = {
            status: "playing",
            players,
            currentPlayerId: players[0].id,
            dice: [
                {id: 0, value: 0, selected: false },
                {id: 1, value: 0, selected: false },
                {id: 2, value: 0, selected: false },
                {id: 3, value: 0, selected: false },
                {id: 4, value: 0, selected: false },
                {id: 5, value: 0, selected: false },
            ],
            turnScore: 0,
            rolled: false,
        };
    }

    getState(): GameState {
        return this.state;
    }

    rollDice(): GameState {
        this.state.dice = this.state.dice.map((dice, index) => ({
            ...dice,
            id: index,
            value: Math.floor(Math.random() * 6) + 1,
            selected: false
        }));

        this.state.rolled = true;

        return this.state;
    }

    nextPlayer() {
        const gameState = this.state;
        let currentIndex = gameState.players.findIndex(
            player => player.id === gameState.currentPlayerId
        );
        
        if(currentIndex == -1) {
            currentIndex = 0;
        }

        const nextIndex = (currentIndex + 1) % gameState.players.length;

        gameState.currentPlayerId = gameState.players[nextIndex].id;
    }

}