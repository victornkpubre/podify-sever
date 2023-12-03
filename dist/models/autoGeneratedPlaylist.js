"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const playlistSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
    },
    items: [{
            type: mongoose_1.Schema.Types.ObjectId,
            required: true,
            ref: "Audio"
        }],
}, { timestamps: true });
const AutoGeneratedPlaylist = mongoose_1.models.AutoGeneratedPlaylist || (0, mongoose_1.model)("AutoGeneratedPlaylist", playlistSchema);
exports.default = AutoGeneratedPlaylist;
