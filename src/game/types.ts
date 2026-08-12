export interface GameState {
    status: "waiting" | "playing" | "finished";
    players: GamePlayer[];
    currentPlayerId: string;
    dice: Dice[];
    turnScore: number;    
    rolled: boolean;
}

export interface GamePlayer {
    id: string;
    username: string;
    score: number;
    connected: boolean;
}

export interface Dice {
    id: number;
    value: number;
    selected: boolean;
}