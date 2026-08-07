import { GameEngine } from "../game/game.engine";
import { Lobby, Player } from "./lobby.types";

export class LobbyManager {
    private lobbies = new Map<string, Lobby>();

    createLobby(
        name: string,
        password: string,
        username: string
    ): { lobby: Lobby; player: Player } {
        const lobbyId = this.generateId();

        const player: Player = {
            id: crypto.randomUUID(),
            username
        };

        const lobby: Lobby = {
            lobbyId: lobbyId,
            lobbyName: name,
            password,
            players: [],
            game: new GameEngine()
        };

        this.lobbies.set(
            lobbyId,
            lobby
        );

        return { lobby, player };
    }


    getLobby(id: string): Lobby | undefined {
        return this.lobbies.get(id);
    }

    joinLobby(
        lobbyId: string,
        password: string,
        username: string,
        socketId: string,
    ): { lobby: Lobby; player: Player } {
        const lobby = this.lobbies.get(lobbyId);

        if (!lobby) {
            throw new Error("Lobby existiert nicht");
        }

        if (lobby.password !== password) {
            throw new Error("Falsches Passwort");
        }

        const player: Player = {
            // id: crypto.randomUUID(),
            id: socketId,
            username,
        };

        lobby.players.push(player);

        return { lobby, player };
    }

    leaveLobby(playerId: string) {
        for (const lobby of this.lobbies.values()) {
            const index = lobby.players.findIndex(
                player => player.id === playerId
            );

            if (index !== -1) {
                lobby.players.splice(index, 1);

                // Lobby löschen, wenn sie leer ist
                if (lobby.players.length === 0) {
                    this.lobbies.delete(lobby.lobbyId);
                }

                return lobby;
            }
        }

        return null;
    }

    private generateId(): string {
        return Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    }
}

export const lobbyManager = new LobbyManager();