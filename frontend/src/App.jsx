import React, { useEffect, useRef, useState } from 'react';
import {io} from 'socket.io-client';
// import SimplePeer from 'simple-peer';

const App = () => {
  const [peers, setPeers] = useState([]);
  const roomIdRef = useRef(null);
  const userIdRef = useRef(null);
  console.log("app started")
  const socket = io.connect('http://localhost:5000');

  useEffect(() => {
    socket.emit('create-room');

    socket.on('room-created', ({ roomId }) => {
      roomIdRef.current = roomId;
      joinRoom(roomId);
    });

    socket.on('new-member', ({ userId }) => {
      addPeer(userId, true);
    });

    socket.on('signal', ({ signal, userId }) => {
      const peer = peers.find(p => p.userId === userId);
      if (peer) {
        peer.signal(signal);
      }
    });

    socket.on('member-left', ({ userId }) => {
      const peer = peers.find(p => p.userId === userId);
      if (peer) {
        peer.destroy();
        setPeers(peers.filter(p => p.userId !== userId));
      }
    });
  }, []);

  const joinRoom = (id) => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      addPeer(socket.id, false, stream);
      socket.emit('join-room', id);
    });
  };

  const addPeer = (userId, initiator, stream = null) => {
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream,
    });

    peer.on('signal', signal => {
      socket.emit('signal', { signal, roomId: roomIdRef.current });
    });

    peer.on('stream', remoteStream => {
      addAudioStream(remoteStream);
    });

    setPeers(peers => [...peers, { peer, userId }]);
  };

  const addAudioStream = (stream) => {
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    document.body.appendChild(audio);
  };

  return (
    <div>
      <h2>Audio Communication</h2>
      {/* Add UI components and controls here */}
    </div>
  );
};

export default App;
