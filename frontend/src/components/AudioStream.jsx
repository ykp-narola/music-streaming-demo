import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import io from 'socket.io-client'; // Make sure you have this installed
import { FaRegCopy } from "react-icons/fa";
import { FiMicOff, FiMic } from "react-icons/fi";
import { base } from '../utils/config';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function AudioStream() {
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
    let userData = useSelector(state => state.auth.userData)
    const [speakerVolume, setSpeakerVolume] = useState({});  // Track speaker volume
    const [usersMute, setUsersMute] = useState({});  // bulk of users muted
    const [mute, setMute] = useState(false);  // Track speaker volume
    const userStream = useRef(null);  // Store the user's media stream
    const navigate = useNavigate();
    useEffect(() => {
      // Initialize socket and peer
      let peerUserId = userData.username.split("@")[0];
      setPeerId(peerUserId);
      const peer = new Peer(peerUserId || undefined);
      peer.on('open', (id) => {
        console.log('id :>> ', id);
        setPeerId(id);
      });
      peerInstance.current = peer;
      return () => peerInstance.current?.destroy();
    }, [userData]);
  
  
    useEffect(()=>{
        peerInstance.current.on('call', (call) => {
            navigator.mediaDevices.getUserMedia({ video: false, audio: true })
            .then((mediaStream) => {
            // response to calling peer
            userStream.current = mediaStream;
            userStream.current.getAudioTracks()[0].enabled = !mute;
            call.answer(mediaStream);
            const video = document.createElement('video')
    
            // and set video tag existing system
            call.on('stream', userVideoStream => {
                monitorAudio(userVideoStream, call.peer)
                addVideoStream(video, userVideoStream)
            })
            // set in existing peer instance
            setPeers((prevPeers) => ({ ...prevPeers, [call.peer]: call }));
            })
            .catch((err) => console.error('Error getting user media:', err));
        });
    }, [])
  
    const monitorAudio = (audioStream, peerId) => {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyser);
      analyser.fftSize = 512;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const volume = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setSpeakerVolume(prev => ({
            ...prev,
            [peerId]: volume  // Track volume for this peerId
        }));
        requestAnimationFrame(checkVolume);
      };
      checkVolume();
    };
    
    function connectToNewUser (userId, stream) {
      // call remote peer instance    //call will listern to .on(call) method
      const call = peerInstance.current.call(userId, stream)
      const video = document.createElement('video')
      // get stream from remote and add video to existing peer instance
      call.on('stream', userVideoStream => {
        monitorAudio(userVideoStream, userId); // Monitor audio
        addVideoStream(video, userVideoStream)
      })
      call.on('close', () => {
        video.remove()
      })
      setPeers((prevPeers) => ({ ...prevPeers, [userId]: call }));
  
    }
  
    const disconnectedPeers = (userId) => {
        if (peers[userId]) peers[userId].close()
        setPeers((prevPeers) => {
            const updatedPeers = { ...prevPeers };
            delete updatedPeers[userId];
            return updatedPeers;
        });
    }
    const call = useCallback((remotePeerId) => {
      setLoading(true); 
      if(!peerInstance.current._open && window.confirm('Your session is already active in another account.')) {
        return navigate("/")
      }
      setTimeout(() => {
        navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        .then((mediaStream) => {
            userStream.current = mediaStream;
            userStream.current.getAudioTracks()[0].enabled = !mute;
            socketRef.current = io.connect(`${base.URL}`,{
                transports: ["websocket"],
                reconnection: true,
                reconnectionDelay: 500,
                reconnectionDelayMax: 3000,
                reconnectionAttempts: 1000,
                forceNew: true,
            });
            socketRef.current.on('user-disconnected', userId => {
                disconnectedPeers(userId);
            })

            socketRef.current.emit('join-room', remotePeerId, peerId);
            
            socketRef.current.on('user-connected', userId => {
              connectToNewUser(userId, mediaStream)
            })

            socketRef.current.on('mute-status', ({peerId, isMuted}) => {
              setUsersMute((prev)=> ({
                ...prev,
                [peerId]: isMuted
              })) 
            })
  
            socketRef.current.on('leave-room', userId => {
              disconnectedPeers(userId);
            });
            setLoading(false);
            setIsButtonDisabled(false);
            setJoined(true);
          })
          .catch((err) => console.error('Error starting call:', err));
      }, 1000);
    }, [peerId, setLoading, connectToNewUser, usersMute]);
  
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
  
    const toggleMute = useCallback(() => {
      setMute(prev => {
        const newMuteState = !prev;
        if (userStream.current) {
          userStream.current.getAudioTracks()[0].enabled = !newMuteState;
        }
        if (socketRef.current) {
          socketRef.current.emit('mute-status-change', peerId, newMuteState);
        }
        setUsersMute(prev => ({
          ...prev,
          [peerId]: newMuteState
        }))
        return newMuteState;
      });
    }, [peerId]);
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
  
          <div className="space-y-4 mt-6">
            {Object.keys(peers).map((userId, index) => {
              const volume = speakerVolume[userId] || 0;
              const scale = Math.min(1 + (volume / 150), 2);  // Adjust scale based on volume
              const isMuted = usersMute[userId] || false
              // console.log('isMuted :>> ',userId,  isMuted); 
              return (
                <div key={userId} className="p-4 bg-blue-50 rounded-lg shadow-md flex justify-between items-center">
                  <p className="font-semibold text-blue-700">User ID: {userId}</p>
                  { volume >= 1  && <div
                    className={`w-6 h-6 rounded-full bg-green-500 transition-transform duration-300 ease-in-out`}
                    style={{
                      transform: `scale(${scale})`,
                      boxShadow: `0 0 ${scale * 10}px rgba(34, 197, 94, 0.6)`
                    }}
                  />}
                  {isMuted ? <FiMicOff /> : null}
                  </div>
              );
            })}
          </div>
          {Object.keys(peers).length === 0 && joined && (
            <p className="text-center text-gray-500 mt-8">Waiting for other users to join...</p>
          )}
  
          {/* {Object.keys(remoteAudioRefs.current).map(peerId => (
            <audio key={peerId} ref={el => remoteAudioRefs.current[peerId] = el} />
          ))} */}
          <div id="video-grid" ref={videoGridRef} className='hidden' ></div>
        </div>
      </div>
    );
}

export default AudioStream
