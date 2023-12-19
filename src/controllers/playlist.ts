import { RequestHandler } from "express";
import Audio, { AudioDocument } from "#/models/audio";
import Playlist from "#/models/playlist";
import { CreatePlaylistRequest, UpdatePlaylistRequest } from "#/requests/audio";
import { isValidObjectId } from "mongoose";
import { MigrationResult, PopulatedFavList } from "#/utils/types";
import { SpotifyApi, AccessToken, } from "@spotify/web-api-ts-sdk";


export const createPlaylist: RequestHandler = async (req: CreatePlaylistRequest, res) => {
    const {title, resId, visibility} = req.body
    const ownerId = req.user.id

    if(resId) {
        const audio = await Audio.findById(resId)
        if(!audio) {
            return res.status(404).json({error: "Could not found the audio"})
        }
    }

    const duplicateTitle = await Playlist.findOne({title: title})

    if(duplicateTitle) return res.status(422).json({error: "You already have a playlist with this title"})

    const newPlaylist = new Playlist({
        title,
        owner: ownerId,
        visibility
    })

    if(resId) 
        newPlaylist.items = [resId as any]
    
    await newPlaylist.save()
    
    res.status(201).json({
        Playlist: {
            id: newPlaylist._id,
            title: newPlaylist.title,
            visibility: newPlaylist.visibility
        }
    })

}


export const updatePlaylist: RequestHandler = async (req: UpdatePlaylistRequest, res) => {
    const {id, item, title, visibility} = req.body
    const playlist = await Playlist.findOneAndUpdate(
        {_id: id, owner: req.user.id},
        {title, visibility}, 
        {new: true}
    )

    if(!playlist) return res.status(404).json({error: "Playlist not found"})

    if(item) {
        const audio = await Audio.findById(item)
        if(!audio) return res.status(404).json({error: "Audio not found"})
        
        await Playlist.findByIdAndUpdate(playlist._id, {
            $addToSet: {items: item}
        })
        
    }

    res.json({playlist: {
        id: playlist._id,
        title: playlist.title,
        visibility: playlist.visibility
    }})

}


export const removePlaylist: RequestHandler = async (req: UpdatePlaylistRequest, res) => {

    const  {playlistId, resId, all} = req.query

    if(all === "yes" ) {
        const playlist = await Playlist.findByIdAndDelete({
            _id: playlistId,
            owner: req.user.id
        })
    
        if(!playlist) return res.status(404).json({error: "Playlist not found!"})

    }

    const playlist = await Playlist.findOneAndUpdate({
        _id: playlistId,
        owner: req.user.id
    }, {
        $pull: {items: resId}
    })

    if(!playlist) return res.status(404).json({error: "Playlist not found!"})

    res.status(200).json({success: true})

}

export const getPlaylistByProfile: RequestHandler = async (req, res) => {
    const {pageNo = "0", limit = "20"} = req.query as { pageNo: string; limit: string}

    const data = await Playlist.find({
        owner: req.user.id,
        visibility: {$ne: 'auto'}
    })
    .skip(parseInt(pageNo) * parseInt(limit))
    .limit(parseInt(limit))
    .sort('-createdAt')

    const playlist = data.map((item) => {
        return {
            id: item._id,
            title: item.title,
            itemsCount: item.items.length,
            visibility: item.visibility
        }
    })

    res.json({playlist})

}

export const getAudios: RequestHandler = async (req, res) => {
    const {playlistId} = req.params;
     

    if( !isValidObjectId(playlistId)) 
        return res.status(422).json({error: "Audio is is invalid"})

    const playlist = await Playlist.findOne({
        owner: req.user.id,
        _id: playlistId
    }).populate<PopulatedFavList>({
        path: "items",
        populate: {
            path: "owner",
            select: "name"
        }
    })

    const audios = playlist?.items.map((item) => {
        
        return {
            id: item._id,
            title: item.title,
            category: item.category,
            file: item.file.url,
            poster: item.poster?.url,
            owner: {name: item.owner.name, id: item.owner._id ,}
        }
    })


    res.json({
        audioslist: {
            id: playlist?._id,
            title: playlist?.title,
            audios
        }
    })
}

export const spotifymigrate: RequestHandler = async (req, res) => {
   const accessToken = {
        access_token: req.body.access_token,
        token_type: req.body.token_type,
        expires_in: req.body.expires_in,
        refresh_token: req.body.refresh_token,
    }
    const sdk = SpotifyApi.withAccessToken('d5d8bfeb561e44c09bab30a30037f3b0', accessToken as AccessToken)

    const audioList = req.body.audio_list as AudioDocument[]
    const matchList: MigrationResult = []

    for (let i = 0; i < audioList.length; i++) {
        const item = audioList[i];

        const result = await sdk.search(`${item.title}%20album:${item.album}%20artist:${item.artist}%20Davis`, ['track'])
         

        //get result items. album, artist and title 

        result.tracks.items.forEach((track) => {

            console.log(track.artists[0].name)
            console.log(item.artist)
            console.log(track.name)
            console.log(item.title)
            console.log(track.album.name)
            console.log(item.album)

            console.log("Found a match")
            console.log(track.artists[0].name === item.artist && track.name === item.title && track.album.name === item.album)

            if (track.artists[0].name === item.artist && track.name === item.title && track.album.name === item.album ) {
                const matchIndex = matchList.findIndex((match) => { match.item._id === item._id})
                const spotifyTrack = {
                    id: track.id, 
                    title: track.name, 
                    artist: track.artists[0].name, 
                    album: track.album.name, 
                    image: track.album.images[1].url 
                }

                console.log("Created spotify track")
                console.log(spotifyTrack)

                console.log("Matches Index")
                console.log(matchIndex)
                
                if(matchIndex == -1) {
                    matchList.push({
                        item: item,
                        matches: [spotifyTrack]
                    })
                }
                else {
                    matchList[matchIndex].matches.push(spotifyTrack)
                }
            }
        })
    }
   
    res.json({data: matchList})
}