import React from 'react'

function AudioPlayerSection({ peerId, broadcastUser, togglePlayPause, isPlaying, duration, currentTime, handleSeek, volume, handleVolumeChange, audioRef, soundUrl}) {
  return (
    <div>
       {peerId === broadcastUser && (
            <div className="w-full p-4 bg-gray-100 rounded-lg shadow-md mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Music Stream</h3>

            {/* Audio player controls for local user */}
            <div className="flex items-center">
                <button 
                className="bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600 focus:outline-none"
                onClick={togglePlayPause}
                >
                {isPlaying ? 'Pause' : 'Play'}
                </button>

                {/* Seek bar to drag and adjust the current time */}
                <input 
                    type="range" 
                    min="0" 
                    max={duration || 100} 
                    value={currentTime}
                    onChange={handleSeek}
                    className="ml-4 w-full"
                />
                <span className="ml-2 text-gray-600">{Math.floor(currentTime)} sec</span>
            </div>
            <div className="mt-4">
                <label className="mr-2">Volume:</label>
                <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full"
                />
            </div>
            {/* Audio element for local playback */}
            <audio 
                ref={audioRef} 
                src={soundUrl}
                controls 
                loop 
                className="w-full mt-2 hidden"
            >
                Your browser does not support the audio element.
            </audio>
            </div>
        )}
    </div>
  )
}

export default AudioPlayerSection
