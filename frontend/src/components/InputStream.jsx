import React from 'react'
import { FiMic, FiMicOff } from 'react-icons/fi'

function InputStream({remotePeerIdValue, setRemotePeerIdValue, getFromURL, joined, leaveChannel, loading, toggleMute, mute, handleConnectClick, isButtonDisabled}) {
  return (
    <div>
       <input 
            type="text" 
            value={remotePeerIdValue}
            onChange={e => setRemotePeerIdValue(e.target.value)} 
            className="bg-cyan-100 border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            required
            disabled = {!!getFromURL || joined}
        />
            
        {joined ? (
            <div className='flex'>
            <button 
                onClick={() => leaveChannel(remotePeerIdValue)} 
                className="ml-2 bg-gray-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
            >
                {loading ? `Leaving` : `Leave`} 
            </button>
            <button 
            onClick={toggleMute} 
            className="ml-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
            >
            {mute ? <FiMicOff className='text-white' /> : <FiMic className='text-white' />}
            </button>
            </div>
            
        ) : (
            <button 
                onClick={handleConnectClick} 
                className="ml-2 bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
                disabled={isButtonDisabled}
            >
            {loading ? `Connecting` : `Connect`}
            </button>
        )}
    </div>
  )
}

export default InputStream
