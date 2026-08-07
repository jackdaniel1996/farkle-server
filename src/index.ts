import express from "express";
// @ts-ignore: no declaration file for 'cors'
import cors from "cors";
import gameRoutes from "./routes/game.routes";
import lobbyRoutes from "./routes/lobby.routes";

const app = express();

const PORT = 3000;

app.use(cors({
    origin: 'http://localhost:4200'
}));

app.use(express.json());

app.get("/", (_, res) => {
    res.send("Hallo vom Server!");
});

app.use("/game", gameRoutes);
app.use("/lobby", lobbyRoutes);

app.listen(PORT, () => {

    console.log(
        `Server läuft auf Port ${PORT}`
    );

});