import React, { useEffect, useState } from 'react';
import axios from '../services/api';

const SongList = () => {
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await axios.get('/songs');
        setSongs(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSongs();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Available Songs</h2>
      <ul className="space-y-4">
        {songs.map(song => (
          <li key={song._id} className="bg-gray-100 p-4 rounded-md shadow-md">
            <p className="text-lg font-medium">{song.title} by {song.artist}</p>
            <audio controls className="mt-2 w-full">
              <source src={`/${song.url}`} type="audio/mpeg" />
            </audio>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SongList;
