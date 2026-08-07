import { GameState } from "./types";


export class GameEngine {

    private state: GameState = {
        dice: [1, 1, 1, 1, 1, 1],
        currentPlayer: 0
    };


    getState(): GameState {
        return this.state;
    }


    rollDice() {

        this.state.dice = this.state.dice.map(() =>
            Math.floor(Math.random() * 6) + 1
        );

    }

}