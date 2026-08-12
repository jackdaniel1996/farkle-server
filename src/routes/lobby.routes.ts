import { Router } from "express";
import { LobbyManager } from "../lobby/lobby.manager";

export const createLobbyRoutes = (lobbyManager: LobbyManager) => {
    const router = Router();

    router.post("/create", (req, res) => {
        const {
            lobbyName,
            username,
            password
        } = req.body;

        const l = lobbyManager.createLobby(
            lobbyName,
            password,
            username
        );

        res.json({
            lobby: {
                lobbyId: l.lobby.lobbyId,
                lobbyName: l.lobby.lobbyName,
                players: l.lobby.players,
            },
            player: l.player,
        });
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

    return router;
};