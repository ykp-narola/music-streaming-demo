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

  const dummyImage = "http://192.168.1.241:5001/uploads/image/dummy_music.jpg"; // Replace with your dummy image URL

  return (
    <div className="flex">
      {/* Main Content */}
      <main className="flex-1 p-6 bg-gray-100 min-h-screen">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">Music Collection</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {music.map((item) => (
            <div 
              key={item._id} 
              className="relative bg-white p-6 rounded-lg shadow-lg overflow-hidden group"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 bg-center bg-cover opacity-30 group-hover:opacity-50 transition-opacity duration-300"
                style={{ backgroundImage: `url(${item.imageUrl ? `http://192.168.1.241:5001/${item.imageUrl}` : dummyImage})` }}
              ></div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">Artist: {item.artist}</p>

                <audio controls className="mt-4 w-full rounded-lg bg-gray-50 border border-gray-300">
                  <source src={`http://192.168.1.241:5001/${item.filePath}`} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default MusicList;
