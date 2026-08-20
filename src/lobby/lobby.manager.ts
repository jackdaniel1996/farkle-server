import { GameEngine } from "../game/game.engine";
import { Dice, GamePlayer } from "../game/types";
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
            turns: 0,
        }

        const game = new GameEngine([gamePlayer], 10000);

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
            if(lobby.status === 'playing') {
                this.disconnectPlayer(socketId);
                throw new Error("Spiel läuft bereits")
            }
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

    startGame(lobbyId: string, socketId: string, maxPoints: number = 10000) {
        const lobby = this.getLobby(lobbyId);

        if (!lobby || !this.io) {
            return;
        }

        const gamePlayers = lobby.players.map((p: Player) => ({
            id: p.id,
            username: p.username,
            score: 0,
            connected: p.connected,
            turns: 0,
        }));

        const game = new GameEngine(gamePlayers, maxPoints);
        this.games.set(lobbyId, game);

        lobby.status = 'playing';
        lobby.game = game.state;
        console.log('lobby-game', game)

        this.io.to(lobbyId).emit('gameStarted', lobby);
    }

    validateGameAction(lobby: Lobby | undefined, game: GameEngine | undefined, socketId: string) {
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

        if (game.state.currentPlayerId !== player.id) {
            throw new Error("Du bist nicht am Zug");
        }

        if(game.state.status === 'finished') {
            throw new Error("Das Spiel ist vorbei")
        }

        return player;
    }

    rollDice(lobbyId: string, socketId: string) {
        const lobby = this.lobbies.get(lobbyId);
        const game = this.games.get(lobbyId);

        this.validateGameAction(lobby, game, socketId);
        if (!game) {
            throw new Error("Spiel existiert nicht");
        }

        if(game.state.farkled) {
            throw new Error("Gefarkled, kann nicht erneut würfeln")
        }

        game.rollDice();

        this.io?.to(lobbyId).emit("diceRolled", game.getState());

        return game.getState();
    }

    selectDice(lobbyId: string, diceId: number, socketId: string) {
        const lobby = this.lobbies.get(lobbyId);
        const game = this.games.get(lobbyId);
        this.validateGameAction(lobby, game, socketId);
        if (!game) {
            throw new Error("Spiel existiert nicht");
        }

        game.selectDice(diceId);
        this.io?.to(lobbyId).emit("diceSelection", game.getState());
        
        return game.getState();
    }
    
    unselectDice(lobbyId: string, diceId: number, socketId: string) {
        const lobby = this.lobbies.get(lobbyId);
        const game = this.games.get(lobbyId);
        this.validateGameAction(lobby, game, socketId);
        if (!game) {
            throw new Error("Spiel existiert nicht");
        }

        game.unselectDice(diceId);
        this.io?.to(lobbyId).emit("diceSelection", game.getState());

        return game.getState();
    }

    scoreDice(lobbyId: string, socketId: string) {
        const lobby = this.lobbies.get(lobbyId);
        const game = this.games.get(lobbyId);
        this.validateGameAction(lobby, game, socketId);
        if (!game) {
            throw new Error("Spiel existiert nicht");
        }

        // roll again
        game.rollDice();
        this.io?.to(lobbyId).emit("diceRolled", game.getState());

        return game.getState();
    }
    
    endTurn(lobbyId: string, socketId: string) {
        const lobby = this.lobbies.get(lobbyId);
        const game = this.games.get(lobbyId);
        this.validateGameAction(lobby, game, socketId);
        if (!game) {
            throw new Error("Spiel existiert nicht");
        }

        // end turn
        game.endTurn();
        this.io?.to(lobbyId).emit("turnEnded", game.getState());

        return game.getState();
    }

    restartGame(lobbyId: string, socketId: string) {
        const lobby = this.lobbies.get(lobbyId);
        const game = this.games.get(lobbyId);

        if (!lobby) {
            throw new Error("Lobby existiert nicht");
        }

        if (!game) {
            throw new Error("Spiel existiert nicht");
        }

        game.restartGame();
        this.io?.to(lobbyId).emit("gameRestartet", game.getState());

        return game.getState();
    }
}