"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
require("./db");
const auth_1 = __importDefault(require("./routers/auth"));
const audio_1 = __importDefault(require("./routers/audio"));
const favorite_1 = __importDefault(require("./routers/favorite"));
const playlist_1 = __importDefault(require("./routers/playlist"));
const profile_1 = __importDefault(require("./routers/profile"));
const history_1 = __importDefault(require("./routers/history"));
const errors_1 = require("./middleware/errors");
const app = (0, express_1.default)();
const PORT = 8989;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static('src/public'));
app.use("/auth", auth_1.default);
app.use("/audio", audio_1.default);
app.use("/favorite", favorite_1.default);
app.use("/playlist", playlist_1.default);
app.use("/profile", profile_1.default);
app.use("/history", history_1.default);
app.use(errors_1.errorHandler);
app.listen(PORT, () => {
    console.log("Port is listening on port " + PORT);
});
