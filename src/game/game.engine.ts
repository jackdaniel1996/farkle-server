import { Dice, DiceValue, GamePlayer, GameState } from "./types";


export class GameEngine {
    public state: GameState;

    constructor(players: GamePlayer[]) {
        this.state = {
            status: "playing",
            players,
            currentPlayerId: players[0].id,
            dice: [
                {id: 0, value: 1, selected: false, selectable: false },
                {id: 1, value: 2, selected: false, selectable: false },
                {id: 2, value: 3, selected: false, selectable: false },
                {id: 3, value: 4, selected: false, selectable: false },
                {id: 4, value: 5, selected: false, selectable: false },
                {id: 5, value: 6, selected: false, selectable: false },
            ],
            turnScore: 0,
            rolled: false,
        };
    }

    getState(): GameState {
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

    rollDice(): GameState {
        this.state.dice = this.state.dice.map((dice, index) => {
            if(dice.selected) return dice;
            else {
                return {
                    ...dice,
                    id: dice.id,
                    value: Math.floor(Math.random() * 6) + 1 as DiceValue,
                    selected: dice.selected
                 }
            }
        });

        this.updateSelectableDice();

        this.state.rolled = true;

        return this.state;
    }

    updateSelectableDice() {
        // Zunächst alle Würfel nicht auswählbar machen
        this.state.dice = this.state.dice.map(dice => ({
            ...dice,
            selectable: false
        }));

        // Werte des aktuellen Wurfs
        const availableDice = this.state.dice.filter(dice => !dice.selected);
        const values = availableDice.map(dice => dice.value);

        // Straße
        if (this.isStraight(values)) {
            this.state.dice = this.state.dice.map(dice => ({
                ...dice,
                selectable: true
            }));

            return;
        }

        // Drei Paare
        if (this.isThreePairs(values)) {
            this.state.dice = this.state.dice.map(dice => ({
                ...dice,
                selectable: true
            }));

            return;
        }

        // Einzelne 1er und 5er
        this.state.dice = this.state.dice.map(dice => ({
            ...dice,
            selectable:
                dice.value === 1 ||
                dice.value === 5
        }));

        // Drillinge
        const counts = this.getDiceCounts(availableDice);

        for (const [value, count] of counts) {
            if (count >= 3) {
                this.state.dice = this.state.dice.map(dice => {
                    if (dice.value === value) {
                        return {
                            ...dice,
                            selectable: true
                        };
                    }

                    return dice;
                });
            }
        }
    }

    private getDiceCounts(dice: Dice[]): Map<DiceValue, number> {
        const counts = new Map<DiceValue, number>();

        for (const d of dice) {
            counts.set(
                d.value,
                (counts.get(d.value) ?? 0) + 1
            );
        }

        return counts;
    }

    private isStraight(values: DiceValue[]): boolean {
        if (values.length !== 6) {
            return false;
        }

        const sorted = [...values].sort((a, b) => a - b);

        return sorted.every(
            (value, index) => value === index + 1
        );
    }

    private isThreePairs(values: DiceValue[]): boolean {
       if (values.length !== 6) {
            return false;
        }

        const counts = new Map<DiceValue, number>();

        for (const value of values) {
            counts.set(value,(counts.get(value) ?? 0) + 1);
        }

        return counts.size === 3 && [...counts.values()].every(count => count === 2);
    }

    selectDice(diceId: number): GameState {
        const dice = this.state.dice.find(d => d.id === diceId);

        if (!dice) {
            throw new Error("Würfel existiert nicht");
        }

        if (!this.state.rolled) {
            throw new Error("Es wurde noch nicht gewürfelt");
        }

        if (dice.selected) {
            throw new Error("Würfel wurde bereits ausgewählt");
        }

        if (!dice.selectable) {
            throw new Error("Dieser Würfel kann nicht ausgewählt werden");
        }

        dice.selected = true;

        return this.state;
    }

    private calculateScore(): number {
        const selectedDice = this.state.dice.filter(dice => dice.selected);

        if (selectedDice.length === 0) {
            return 0;
        }

        const values = selectedDice.map(dice => dice.value);

        // Straße
        if (this.isStraight(values)) {
            return 1500;
        }

        // Drei Paare
        if (this.isThreePairs(values)) {
            return 750;
        }

        const counts = this.getDiceCounts(selectedDice);

        let score = 0;

        for (const [value, count] of counts) {
            // Drilling oder mehr
            if (count >= 3) {
                const baseScore = value === 1
                    ? 1000
                    : value * 100;

                // Jeder zusätzliche Würfel verdoppelt
                score += baseScore * Math.pow(2, count - 3);

                continue;
            }

            // Einzelne 1er
            if (value === 1) {
                score += count * 100;
            }

            // Einzelne 5er
            if (value === 5) {
                score += count * 50;
            }
        }

        return score;
    }

    unselectDice(diceId: number): GameState {
        this.state.dice = this.state.dice.map((dice) => {
            if(dice.id === diceId) {
                return {
                    ...dice,
                    selected: false,
                }
            } else {
                return dice;
            }
        })

        return this.state;
    }
}