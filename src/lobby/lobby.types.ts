import { GameEngine } from "../game/game.engine";

export interface Lobby {
    id: string;
    name: string;
    password: string;

    players: Player[];

    game: GameEngine;
}

export interface Player {
    id: string;
    username: string;
}