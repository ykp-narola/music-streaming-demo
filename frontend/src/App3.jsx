import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import io from 'socket.io-client'; // Make sure you have this installed
import { FaRegCopy } from "react-icons/fa";

function App() {
  const socketRef = useRef(null);
  const peerInstance = useRef(null);
  const videoGridRef = useRef(null);
  const [peerId, setPeerId] = useState('');
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('ROOM_ID');
  const [peers, setPeers] = useState({});
  const [joined, setJoined] = useState(false);
  const [mode, setMode] = useState('meeting');
  const remoteAudioRefs = useRef({});
  const [loading, setLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  
  useEffect(() => {
    // Initialize socket and peer
    socketRef.current = io.connect("http://192.168.1.241:5001",{
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      reconnectionAttempts: 1000,
      forceNew: true,
    });
    const peer = new Peer();
    peer.on('open', (id) => {
      console.log('id :>> ', id);
      setPeerId(id);
    });

    socketRef.current.on('user-disconnected', userId => {
      if (peers[userId]) peers[userId].close()
      setPeers((prevPeers) => {
        const updatedPeers = { ...prevPeers };
        delete updatedPeers[userId];
        return updatedPeers;
      });
    })

    peerInstance.current = peer;

    return () => peerInstance.current?.destroy();
  }, []);

  console.log('peers :>> ', peers);
  useEffect(()=>{
    peerInstance.current.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then((mediaStream) => {
        // response to calling peer
        call.answer(mediaStream);
        const video = document.createElement('video')

        // and set video tag existing system
        call.on('stream', userVideoStream => {
          addVideoStream(video, userVideoStream)
        })
        // set in existing peer instance
        setPeers((prevPeers) => ({ ...prevPeers, [call.peer]: call }));
      })
      .catch((err) => console.error('Error getting user media:', err));
    });
  }, [peers])

  function connectToNewUser (userId, stream) {
    // call remote peer instance    //call will listern to .on(call) method
    const call = peerInstance.current.call(userId, stream)
    const video = document.createElement('video')
    // get stream from remote and add video to existing peer instance
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
      video.remove()
    })
    setPeers((prevPeers) => ({ ...prevPeers, [userId]: call }));

  }

  const call = useCallback((remotePeerId) => {
    setLoading(true);  
    setTimeout(() => {
      navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then((mediaStream) => {
          socketRef.current.emit('join-room', remotePeerId, peerId);
          
          socketRef.current.on('user-connected', userId => {
            connectToNewUser(userId, mediaStream)
          })

          socketRef.current.on('leave-room', userId => {
            if (peers[userId]) peers[userId].close()
            setPeers((prevPeers) => {
              const updatedPeers = { ...prevPeers };
              delete updatedPeers[userId];
              return updatedPeers;
            });
          });
          setLoading(false);
          setIsButtonDisabled(false);
          setJoined(true);
        })
        .catch((err) => console.error('Error starting call:', err));
    }, 1000);
  }, [peerId, setLoading, connectToNewUser]);

  const handleConnectClick = useCallback(() => {
    setIsButtonDisabled(true);
    call(remotePeerIdValue);
   
  }, [call, remotePeerIdValue, isButtonDisabled, peers]);

  const leaveChannel = useCallback((peerId) => {
    setLoading(true);  
    setTimeout(()=>{
      for (const index of Object.keys(peers)) {
        peers[index].close()
        setPeers((prevPeers) => {
          const updatedPeers = { ...prevPeers };
          delete updatedPeers[index];
          return updatedPeers;
        });
      }
      socketRef.current.emit("leave-room",remotePeerIdValue)
      // document.getElementById('video-grid').innerHTML = ''
      videoGridRef.current.innerHTML =''
      setLoading(false);
      setJoined(false);
    },800)
  }, [remotePeerIdValue, peers]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(peerId)
      .then(() => alert('Room ID copied to clipboard!'))
      .catch(() => alert('Failed to copy Room ID.'));
  };

  const addVideoStream = (video, stream) => {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    videoGridRef.current.append(video)
  }

  // console.log('flag :>> ', flag);
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Audio Meeting Room</h2>
        
        <div className="flex items-center mb-6 justify-center">
          <p className="text-gray-600">User ID: 
            <span className="font-mono bg-gray-200 p-1 rounded ml-2">{peerId}</span>
          </p>
          <button 
            onClick={copyToClipboard} 
            className="ml-2 text-cyan-500 hover:text-cyan-700 focus:outline-none"
            title="Copy Room ID"
          >
            <FaRegCopy className="h-5 w-5" />
          </button>

          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value)} 
            className="bg-white border border-gray-300 rounded-md p-2 ml-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          >
            <option value="meeting">Meeting</option>
            <option value="broadcast">Broadcast</option>
          </select>
        </div>

        <div className='flex justify-center'>
          <input 
            type="text" 
            value={remotePeerIdValue}
            onChange={e => setRemotePeerIdValue(e.target.value)} 
            className="bg-cyan-100 border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            required
          />

          {joined ? (
            <button 
              onClick={() => leaveChannel(remotePeerIdValue)} 
              className="ml-2 bg-gray-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
            >
              {loading ? `Leaving` : `Leave`} 
            </button>
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

        <div className="space-y-4 mt-6">
          {Object.keys(peers).map((userId, index) =>{
            return  (
            <div key={userId} className="p-4 bg-blue-50 rounded-lg shadow-md">
              <p className="font-semibold text-blue-700">User ID: {userId}</p>
            </div>
          )})}
        </div>

        {Object.keys(peers).length === 0 && !joined && (
          <p className="text-center text-gray-500 mt-8">Waiting for other users to join...</p>
        )}

        {Object.keys(remoteAudioRefs.current).map(peerId => (
          <audio key={peerId} ref={el => remoteAudioRefs.current[peerId] = el} />
        ))}
        <div id="video-grid" ref={videoGridRef} className='hidden' ></div>
      </div>
    </div>
  );
}

export default App;
