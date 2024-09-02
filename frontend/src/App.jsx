import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import './App.css';
import { FaRegCopy } from "react-icons/fa";

function App() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
  const [peers, setPeers] = useState([]);
  const remoteVideoRef = useRef(null);
  const currentUserVideoRef = useRef(null);
  const peerInstance = useRef(null);

  useEffect(() => {
    const peer = new Peer();

    peer.on('open', (id) => {
      setPeerId(id)
    });

    peer.on('call', (call) => {
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if(!navigator.getUserMedia) console.log("User Media permission not available") 
      navigator.getUserMedia({ video: false, audio: true }, (mediaStream) => {
        console.log('calling site :>> ', mediaStream); 
        // currentUserVideoRef.current.srcObject = mediaStream;
        // currentUserVideoRef.current.play();
        setPeers((peers) => [...peers, { userId: mediaStream.id }]);
        call.answer(mediaStream)
        call.on('stream', function(remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream
          remoteVideoRef.current.play();
        });
      });
    })

    peerInstance.current = peer;
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(peerId).then(() => {
      alert('Room ID copied to clipboard!');
    }, () => {
      alert('Failed to copy Room ID.');
    });
  };

  const call = (remotePeerId) => {
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if(!navigator.getUserMedia) console.log("navigator.getUserMedia not available")
 
    navigator.getUserMedia({ video: false, audio: true }, (mediaStream) => {
      // currentUserVideoRef.current.srcObject = mediaStream;
      // currentUserVideoRef.current.play();

      const call = peerInstance.current.call(remotePeerId, mediaStream)

      call.on('stream', (remoteStream) => {
        console.log('remoteStream :>> ', remoteStream);
        remoteVideoRef.current.srcObject = remoteStream
        remoteVideoRef.current.play();
      });
    },
    (err) => console.log('error :>> ', err));
  }

  return (
    <>
    <div className="App">
     
    </div>

    <div className="min-h-screen bg-gray-100 p-8">
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Audio Meeting Room</h2>
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
        </div>
      <input 
        type="text" 
        value={remotePeerIdValue} 
        onChange={e => setRemotePeerIdValue(e.target.value)} 
        className="bg-cyan-100 border border-gray-300 rounded-md p-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
        required
      />

      <button 
        onClick={() => call(remotePeerIdValue)} 
        className="ml-2 bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
      >
        Call
      </button>

      <div className="space-y-4">
        {peers.map((peerObj, index) => (
          <div key={index} className="p-4 bg-blue-50 rounded-lg shadow-md">
            <p className="font-semibold text-blue-700">User ID: {peerObj.userId}</p>
          </div>
        ))}
      </div>
      {peers.length === 0 && (
        <p className="text-center text-gray-500 mt-8">Waiting for other users to join...</p>
      )}
    </div>
    </div>
    </>
  );
}

export default App;