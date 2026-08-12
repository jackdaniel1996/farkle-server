import { GamePlayer, GameState } from "./types";


export class GameEngine {
    private state: GameState;

    constructor(players: GamePlayer[]) {
        this.state = {
            status: "playing",
            players,
            currentPlayerId: players[0].id,
            dice: [],
            turnScore: 0,
            rolled: false,
        };
    }

    getState(): GameState {
        return this.state;
    }

    rollDice() {        

    }

    nextPlayer() {
        const gameState = this.state;
        let currentIndex = gameState.players.findIndex(
            player => player.id === gameState.currentPlayerId
        );
        
        if(currentIndex < 0) {
            currentIndex = 0;
        }

        const nextIndex = (currentIndex + 1) % gameState.players.length;

        gameState.currentPlayerId = gameState.players[nextIndex].id;
    }

}