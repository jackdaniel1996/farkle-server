import { GameEngine } from "../game/game.engine";
import { GamePlayer } from "../game/types";
import { Lobby, Player } from "./lobby.types";
import { Server } from "socket.io";

export class LobbyManager {
    private lobbies = new Map<string, Lobby>();
    private games = new Map<string, GameEngine>();
    private io?: Server | undefined;

    constructor(io: Server | undefined) {
        this.io = io;
    }

    createLobby(
        name: string,
        password: string,
        username: string
    ): { lobby: Lobby; player: Player } {
        const lobbyId = this.generateId();

        const player: Player = {
            id: crypto.randomUUID(),
            socketId: '',
            username,
            connected: false,
        };

        const gamePlayer: GamePlayer = {
            id: player.id,
            username: player.username,
            score: 0,
            connected: player.connected,
        }

        const game = new GameEngine([gamePlayer]);

        const lobby: Lobby = {
            lobbyId: lobbyId,
            lobbyName: name,
            password,
            players: [],
            status: 'waiting',
            game: game.state
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
        playerId?: string | undefined
    ): { lobby: Lobby; player: Player } {
        const lobby = this.lobbies.get(lobbyId);
        console.log('lobbies', this.lobbies.values())
        if (!lobby) {
            throw new Error("Lobby existiert nicht");
        }

        if (lobby.password !== password) {
            throw new Error("Falsches Passwort");
        }

        const existingPlayer = playerId ? lobby.players.find(p => p.id === playerId) : undefined;
        console.log('existingPlayer', existingPlayer);

        if (existingPlayer) {
            // Reconnect
            existingPlayer.connected = true;
            existingPlayer.socketId = socketId;
            existingPlayer.username = username;

            return {
                lobby,
                player: existingPlayer
            };
        } else {
            // create id when new player joins lobby
            let player: Player = {
                id: playerId ? playerId : crypto.randomUUID(),
                socketId: socketId,
                username,
                connected: true
            };
            lobby.players.push(player);
            console.log('newPlayerJoin', player, playerId);

            return { lobby, player };
        }
    }

    disconnectPlayer(socketId: string): Lobby | null {
        for (const lobby of this.lobbies.values()) {

            const player = lobby.players.find(
                player => player.socketId === socketId
            );

            if (!player) {
                continue;
            }

            player.connected = false;
            player.socketId = undefined;

            this.deleteLobbyIn5Min(lobby.lobbyId);

            return lobby;
        }

        return null;
    }

    deleteLobbyIn5Min(lobbyId: string) {
        const fiveMinInMs = 5 * 60 * 1000;

        setTimeout(() => {
            const lobby = this.lobbies.get(lobbyId);

            if (!lobby) {
                return;
            }

            const connectedPlayers = lobby.players.filter(player => player.connected);

            if (connectedPlayers.length === 0) {
                this.lobbies.delete(lobbyId);
            }
        }, fiveMinInMs);
    }

    private generateId(): string {
        return Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

    }

    startGame(lobbyId: string, socketId: string) {
        const lobby = this.getLobby(lobbyId);

        if (!lobby || !this.io) {
            return;
        }

        const gamePlayers = lobby.players.map((p: Player) => ({
            id: p.id,
            username: p.username,
            score: 0,
            connected: p.connected,
        }));

        const game = new GameEngine(gamePlayers);
        this.games.set(lobbyId, game);

        lobby.status = 'playing';
        lobby.game = game.state;
        console.log('lobby-game', game)

        this.io.to(lobbyId).emit('gameStarted', lobby);
    }

    rollDice(lobbyId: string, socketId: string) {
        const lobby = this.lobbies.get(lobbyId);
        const game = this.games.get(lobbyId);

        if (!lobby) {
            throw new Error("Lobby existiert nicht");
        }

        if (!game) {
            throw new Error("Spiel existiert nicht");
        }

        const player = lobby.players.find(
            player => player.socketId === socketId
        );

        if (!player) {
            throw new Error("Spieler nicht gefunden");
        }

        if (lobby.game.currentPlayerId !== player.id) {
            throw new Error("Du bist nicht am Zug");
        }

        lobby.game = game.rollDice();

        this.io?.to(lobbyId).emit("diceRolled", lobby);

        return lobby;
    }
}