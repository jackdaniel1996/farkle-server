import { GameEngine } from "../game/game.engine";
import { GameState } from "../game/types";

export interface Lobby {
    lobbyId: string;
    lobbyName: string;
    password: string;

    players: Player[];
    status: 'waiting' | 'playing' | 'finished';

    game: GameState;
}

export interface Player {
    id: string;
    socketId: string | undefined;
    username: string;
    connected: boolean;
}