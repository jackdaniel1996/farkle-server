import { Router } from "express";
import { GameEngine } from "../game/game.engine";

export const createGameRoutes = (game: GameEngine) => {
    const router = Router();

    router.get("/", (_, res) => {

        res.json(
            game.getState()
        );

    });


    router.post("/roll", (_, res) => {

        game.rollDice();

        res.json(
            game.getState()
        );

    });


    return router;
};