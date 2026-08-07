import { Router } from "express";
import { GameEngine } from "../game/game.engine";


const router = Router();

const game = new GameEngine();


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


export default router;