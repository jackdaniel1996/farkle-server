import express from "express";
import cors from "cors";
import { createServer } from "http";
import { createGameRoutes } from "./routes/game.routes";
import { Server } from "socket.io";
import { LobbyManager } from "./lobby/lobby.manager";
import { createLobbyRoutes } from "./routes/lobby.routes";
import { GameEngine } from "./game/game.engine";

const allowedOrigins = [
    "http://localhost:4200",
    "https://farkle.danielkle.in"
];
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins
    }
});

const lm = new LobbyManager(io);
// const gameEngine = new GameEngine();
const PORT = 3000;

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

app.get("/", (_, res) => {
    res.send("Hallo vom Server!");
});

// app.use("/game", createGameRoutes(gameEngine));
app.use("/lobby", createLobbyRoutes(lm));

io.on("connection", (socket) => {
    console.log(
        "Spieler verbunden:",
        socket.id
    );

    socket.on("joinLobby", ({lobbyId, username, password, id}, callback) => {
        try {
            const result = lm.joinLobby(lobbyId, password, username, socket.id, id);
            socket.join(lobbyId);

            io.to(lobbyId).emit("lobbyUpdated", result.lobby);

            socket.emit("joinedLobby", result.player);

            callback?.({
                success: true
            });

            } catch(error) {
                callback?.({
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : "Fehler beim beitreten der Lobby."
                });
            }
        }
    );

    socket.on("disconnect", () => {
        const lobby = lm.disconnectPlayer(socket.id);

        if (lobby) {
            io.to(lobby.lobbyId).emit("lobbyUpdated", lobby);
        }
        console.log(
            "Spieler getrennt:",
            socket.id
        );
    });

    socket.on('startGame', ({ lobbyId, maxPoints }, callback) => {
        try {
            lm.startGame(lobbyId, socket.id, maxPoints);
            callback?.({
                success: true
            });
        } catch (error) {
            callback?.({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Das Spiel kann nicht gestartet werden."
            });
        }
    });

    socket.on("rollDice", ({ lobbyId }, callback) => {
        try {
            lm.rollDice(lobbyId, socket.id);
            callback?.({
                success: true
            });
        } catch (error) {
            callback?.({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Fehler beim Würfeln"
            });
        }
    });

    socket.on("selectDice", ({lobbyId, diceId}, callback) => {
        try {
            lm.selectDice(lobbyId, diceId, socket.id);
            callback?.({
                success: true
            });
        } catch (error) {
            callback?.({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Fehler beim Würfel auswählen"
            });
        }
    })

    socket.on("unselectDice", ({lobbyId, diceId}, callback) => {
        try {
            lm.unselectDice(lobbyId, diceId, socket.id);
            callback?.({
                success: true
            });
        } catch (error) {
            callback?.({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Fehler beim Würfel abwählen"
            });
        }
    });

    socket.on("scoreDice", ({lobbyId}, callback) => {
        try {
            lm.scoreDice(lobbyId, socket.id);
            callback?.({
                success: true
            });
        } catch (error) {
            callback?.({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Fehler beim Punkten"
            });
        }
    });

    socket.on("endTurn", ({lobbyId}, callback) => {
        try {
            lm.endTurn(lobbyId, socket.id);
            callback?.({
                success: true
            });
        } catch (error) {
            callback?.({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Fehler beim beenden des Zuges"
            });
        }
    });

    socket.on("restartGame", ({lobbyId}, callback) => {
        try {
            lm.restartGame(lobbyId, socket.id);
            callback?.({
                success: true
            });
        } catch (error) {
            callback?.({
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Fehler beim Neustart des Spiels"
            });
        }
    });
});

httpServer.listen(PORT, () => {
    console.log(
        `Server läuft auf Port ${PORT}`
    );
});