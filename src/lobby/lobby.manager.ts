import { GameEngine } from "../game/game.engine";
import { Lobby, Player } from "./lobby.types";

export class LobbyManager {
    private lobbies = new Map<string, Lobby>();

    createLobby(
        name: string,
        password: string,
        username: string
    ): Lobby {
        const lobbyId = this.generateId();

        const player: Player = {
            id: crypto.randomUUID(),
            username
        };

        const lobby: Lobby = {
            id: lobbyId,
            name,
            password,
            players: [
                player
            ],
            game: new GameEngine()
        };

        this.lobbies.set(
            lobbyId,
            lobby
        );

        return lobby;
    }


    getLobby(id: string): Lobby | undefined {
        return this.lobbies.get(id);
    }

    joinLobby(
        lobbyId: string,
        password: string,
        username: string
    ): Lobby {
        const lobby = this.lobbies.get(lobbyId);

        if (!lobby) {
            throw new Error("Lobby existiert nicht");
        }

        if (lobby.password !== password) {
            throw new Error("Falsches Passwort");
        }

        const player: Player = {
            id: crypto.randomUUID(),
            username
        };

        lobby.players.push(player);

        return lobby;
    }

    private generateId(): string {
        return Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    }
}

export const lobbyManager = new LobbyManager();