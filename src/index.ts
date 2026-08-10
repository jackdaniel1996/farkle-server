import express from "express";
import cors from "cors";
import { createServer } from "http";
import gameRoutes from "./routes/game.routes";
import lobbyRoutes from "./routes/lobby.routes";
import { Server } from "socket.io";
import { lobbyManager } from "./lobby/lobby.manager";

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

const PORT = 3000;

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

app.get("/", (_, res) => {
    res.send("Hallo vom Server!");
});

app.use("/game", gameRoutes);
app.use("/lobby", lobbyRoutes);

io.on("connection", (socket) => {
    console.log(
        "Spieler verbunden:",
        socket.id
    );

    socket.on("joinLobby", ({lobbyId, username, password, id}) => {
        try {
            const result = lobbyManager.joinLobby(lobbyId, password, username, socket.id, id);
            socket.join(lobbyId);

            io.to(lobbyId).emit("lobbyUpdated", result.lobby);

            socket.emit("joinedLobby", result.player);

            } catch(error) {
                socket.emit(
                    "lobbyError",
                    {
                        message:
                            error instanceof Error
                                ? error.message
                                : "Fehler"
                    }
                );
            }
        }
    );

    socket.on("disconnect", () => {
        const lobby = lobbyManager.disconnectPlayer(socket.id);

        if (lobby) {
            io.to(lobby.lobbyId).emit("lobbyUpdated", lobby);
        }
        console.log(
            "Spieler getrennt:",
            socket.id
        );
    });
});

httpServer.listen(PORT, () => {
    console.log(
        `Server läuft auf Port ${PORT}`
    );
});