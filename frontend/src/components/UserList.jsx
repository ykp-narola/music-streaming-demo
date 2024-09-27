import React from 'react'
import { FaBroadcastTower } from 'react-icons/fa';
import { FiMicOff } from 'react-icons/fi';

function UserList({peers, speakerVolume, usersMute, broadcastUser, joined}) {
  return (
    <div>
        {broadcastUser && <p className="text-center text-gray-500 mt-8 mb-3"> Broadcast By {broadcastUser} </p>}
        {Object.keys(peers).map((userId, index) => {
            const volume = speakerVolume[userId] || 0;
            const scale = Math.min(1 + (volume / 150), 2);  // Adjust scale based on volume
            const isMuted = usersMute[userId] || false
            // console.log('isMuted :>> ',userId,  isMuted); 
            return (
            <div key={userId} className="p-4 bg-blue-50 rounded-lg shadow-md flex justify-between items-center">
                <div>
                <p className="font-semibold text-blue-700">User ID: {userId}</p>
                </div>
                <div className='flex items-center'>
                { volume >= 1  && <div
                    className={`w-6 h-6 mr-2 rounded-full bg-green-500 transition-transform duration-300 ease-in-out`}
                    style={{
                    transform: `scale(${scale})`,
                    boxShadow: `0 0 ${scale * 10}px rgba(34, 197, 94, 0.6)`
                    }}
                />}
                {isMuted ? <FiMicOff className='mr-2'/> : null}
                {userId == broadcastUser ? <FaBroadcastTower className='mr-2'/> : null}
                </div>
            </div>
            );
        })}
        {Object.keys(peers).length === 0 && joined && (
            <p className="text-center text-gray-500 mt-8">Waiting for other users to join...</p>
        )}
    </div>
  )
}

export default UserList
