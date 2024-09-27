import React from 'react'
import { FiMic, FiMicOff } from 'react-icons/fi'

function InputStream({remotePeerIdValue, setRemotePeerIdValue, getFromURL, joined, leaveChannel, loading, toggleMute, mute, handleConnectClick, isButtonDisabled, broadcastUser, mode, peerId}) {
  return (
    <div className="flex flex-col md:flex-row items-center">
    <input
      type="text"
      value={remotePeerIdValue}
      onChange={(e) => setRemotePeerIdValue(e.target.value)}
      className="bg-cyan-100 border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent w-full md:w-auto"
      required
      disabled={!!getFromURL || joined}
    />
    {joined ? (
      <div className="flex flex-col md:flex-row ml-0 md:ml-2 mt-4 md:mt-0 space-y-4 md:space-y-0">
        <button
          onClick={() => leaveChannel(remotePeerIdValue)}
          className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 w-full md:w-auto"
        >
          {loading ? `Leaving` : `Leave`}
        </button>
  
        {
            mode == "broadcast" && peerId == broadcastUser &&
            <button
            onClick={toggleMute}
            className="ml-0 md:ml-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 w-full md:w-auto flex items-center justify-center"
            >
            
            {mute ? <FiMicOff className="text-white" /> : <FiMic className="text-white" />}
            
            </button> }
        {
            mode == "meeting" &&
             <button
             onClick={toggleMute}
             className="ml-0 md:ml-2 bg-orange-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 w-full md:w-auto flex items-center justify-center"
             >
             
             {mute ? <FiMicOff className="text-white" /> : <FiMic className="text-white" />}
             
             </button>
        }
      </div>
    ) : (
      <button
        onClick={handleConnectClick}
        className="ml-0 md:ml-2 mt-4 md:mt-0 bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50 w-full md:w-auto"
        disabled={isButtonDisabled}
      >
        {loading ? `Connecting` : `Connect`}
      </button>
    )}
  </div>
  
  )
}

export default InputStream
