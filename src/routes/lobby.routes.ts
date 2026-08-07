import { Router } from "express";
import { lobbyManager } from "../lobby/lobby.manager";

const router = Router();

router.post("/create", (req, res) => {
    const {
        lobbyName,
        username,
        password
    } = req.body;

    const lobby = lobbyManager.createLobby(
        lobbyName,
        password,
        username
    );

    res.json({
        lobby: {
            lobbyId: lobby.lobby.lobbyId,
            lobbyName: lobby.lobby.lobbyName,
            players: lobby.lobby.players,
        },
        player: lobby.player,
    });
});

router.post("/join", (req, res) => {
    const {
        lobbyId,
        username,
        password,
        socketId,
    } = req.body;

    try {
        const lobby = lobbyManager.joinLobby(
            lobbyId,
            password,
            username,
            socketId
        );

        res.json({
            lobby: {
                lobbyId: lobby.lobby.lobbyId,
                lobbyName: lobby.lobby.lobbyName,
                players: lobby.lobby.players,
            },
            player: lobby.player,
        });

    } catch(error) {

        res.status(400).json({
            message: error instanceof Error
                ? error.message
                : "Unbekannter Fehler"
        });

    }
});

router.get("/:id", (req, res) => {
    const lobby = lobbyManager.getLobby(
        req.params.id
    );

    if (!lobby) {

        res.status(404).json({
            message: "Lobby nicht gefunden"
        });

        return;
    }

    res.json(lobby);
});

export default router;