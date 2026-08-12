import { GameEngine } from "../game/game.engine";

export interface Lobby {
    lobbyId: string;
    lobbyName: string;
    password: string;

    players: Player[];
    status: 'waiting' | 'playing' | 'finished';

    game: GameEngine;
}

export interface Player {
    id: string;
    socketId: string | undefined;
    username: string;
    connected: boolean;
}