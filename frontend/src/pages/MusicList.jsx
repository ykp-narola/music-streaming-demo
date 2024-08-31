import React, { useEffect, useState } from 'react';
import axios from '../services/api';

const MusicList = () => {
  const [music, setMusic] = useState([]);

  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const response = await axios.get('/music');
        setMusic(response.data);
      } catch (error) {
        console.error('Error fetching music', error);
      }
    };

    fetchMusic();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Music List</h2>
      <ul className="space-y-4">
        {music.map((item) => (
          <li key={item._id} className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
            {/* <img 
              src={item.imageUrl} 
              alt={item.title} 
              className="w-24 h-24 object-cover rounded-md"
            /> */}
            <div>
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="text-gray-600">Artist: {item.artist}</p>
              <audio controls className="mt-2">
                <source src={`http://localhost:5000/${item.filePath}`} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MusicList;
