import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import { FaRegCopy } from "react-icons/fa";

function App() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
  const [peers, setPeers] = useState([]);
  const [joined, setJoined] = useState(null);
  const [calls, setCalls] = useState(null);
  const [mode, setMode] = useState('meeting'); // State to handle mode selection
  const remoteAudioRef = useRef(null);
  const peerInstance = useRef(null);

  useEffect(() => {
    const peer = new Peer();

    peer.on('open', (id) => setPeerId(id));

    peer.on('call', (call) => {
      handleIncomingCall(call);
    });

    peerInstance.current = peer;

    // Clean up on component unmount
    return () => peerInstance.current?.destroy();
  }, []);

  const handleIncomingCall = (call) => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then((mediaStream) => {
        setPeers((prevPeers) => [...prevPeers, { userId: call.peer }]);
        call.answer(mediaStream);
        handleStream(call);
      })
      .catch((err) => console.error('Error getting user media:', err));
  };

  const handleStream = (call) => {
    call.on('stream', (remoteStream) => {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play();
    });

    call.on('close', () => leaveChannel(call.peer));
  };

  const call = useCallback((remotePeerId) => {
    navigator.mediaDevices.getUserMedia({ video: false, audio: true })
      .then((mediaStream) => {
        const call = peerInstance.current.call(remotePeerId, mediaStream);
        setJoined({ userId: remotePeerId });
        setCalls(call);
        handleStream(call);
      })
      .catch((err) => console.error('Error starting call:', err));
  }, []);

  const leaveChannel = useCallback((peerId) => {
    if (calls) {
      calls.close();
      setCalls(null);
    }
    if (remoteAudioRef.current) {
      const tracks = remoteAudioRef.current.srcObject?.getTracks();
      tracks?.forEach(track => track.stop());
      remoteAudioRef.current.srcObject = null;
    }
    setJoined(null);
    setPeers((prevPeers) => prevPeers.filter(peer => peer.userId !== peerId));
  }, [calls]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(peerId)
      .then(() => alert('Room ID copied to clipboard!'))
      .catch(() => alert('Failed to copy Room ID.'));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Audio Meeting Room</h2>
        
        <div className="flex items-center mb-6 justify-center">
          <p className="text-gray-600">Room ID: 
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
            onClick={() => leaveChannel(joined.userId)} 
            className="ml-2 bg-gray-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
          >
            Leave
          </button>
        ) : (
          <button 
            onClick={() => call(remotePeerIdValue)} 
            className="ml-2 bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
          >
            Call
          </button>
        )}

        </div>
        <div className="space-y-4 mt-6">
          {peers.map((peerObj, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg shadow-md">
              <p className="font-semibold text-blue-700">User ID: {peerObj.userId}</p>
            </div>
          ))}
        </div>
        {peers.length === 0 && !joined && (
          <p className="text-center text-gray-500 mt-8">Waiting for other users to join...</p>
        )}

        <audio ref={remoteAudioRef} />
      </div>
    </div>
  );
}

export default App;
