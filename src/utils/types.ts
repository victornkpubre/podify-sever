import { AudioDocument } from "#/models/audio";
import { ObjectId } from "mongoose";

export type PopulatedFavList = {items: AudioDocument<{_id: ObjectId, name: string}>[]}
export type OwnerObject = {_id: ObjectId, name: string}
export type PaginationQuery = {pageNo: string; limit: string}
export type OwnerPopulation = AudioDocument<{_id: ObjectId, name: string}>
export type SpotifyAudio = {id: string, title: string, artist: string, album: string, image?: string}
export type MigrationMatch = {item: AudioDocument, matches: SpotifyAudio[]}
export type MigrationResult = MigrationMatch[]