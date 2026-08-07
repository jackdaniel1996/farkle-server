import { LobbyManager } from "./lobby/lobby.manager";


const manager = new LobbyManager();


const lobby = manager.createLobby(
    "Farkle Abend",
    "1234",
    "Daniel"
);


console.log(lobby);


manager.joinLobby(
    lobby.id,
    "1234",
    "Max"
);


console.log(
    manager.getLobby(lobby.id)
);