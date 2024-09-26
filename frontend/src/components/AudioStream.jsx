import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import io from 'socket.io-client'; // Make sure you have this installed
import { FaRegCopy, FaBroadcastTower } from "react-icons/fa";
import { FiMicOff, FiMic } from "react-icons/fi";
import { base } from '../utils/config';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from '../services/api';

function AudioStream({ stream=""}) {
    const socketRef = useRef(null);
    const peerInstance = useRef(null);
    const videoGridRef = useRef(null);
    const [peerId, setPeerId] = useState('');
    const getFromURL = stream ? true : false;
    const [remotePeerIdValue, setRemotePeerIdValue] = useState(stream || 'ROOM_ID');
    const [peers, setPeers] = useState({});
    const [joined, setJoined] = useState(false);
    const [mode, setMode] = useState('');
    const [loading, setLoading] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);
    let userData = useSelector(state => state.auth.userData)
    const [speakerVolume, setSpeakerVolume] = useState({});  // Track speaker volume
    const [usersMute, setUsersMute] = useState({});  // bulk of users muted
    const [mute, setMute] = useState(false);  // Track speaker mute
    const [broadcastUser, setBroadcastUser] = useState("");  // Track speaker volume
    const userStream = useRef(null);  // Store the user's media stream
    const navigate = useNavigate();
    const audioContextRef = useRef(null);
    const destinationRef = useRef(null);
    const demoSoundUrl = "http://192.168.1.241:5001/uploads/music/1725015358640.mp3"; 

    useEffect(() => {
      // Initialize socket and peer
      let peerUserId = userData?.username?.split("@")[0];
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
      (async()=>{
        let response = await axios.post("/meeting",{
          query: {
            room: remotePeerIdValue,
            mode: "broadcast",
          }
        })
        if(response.data.data){
          setBroadcastUser(response.data.data.createdBy);
          setMode("broadcast");
        }else{
          setBroadcastUser("");
          setMode("meeting");
        } 
      })()
    }, [remotePeerIdValue])
  
    // Handler for incoming peer calls
    const handleIncomingCall = async (call) => {
      try {    
        // Make API call to get broadcast info
        const response = await axios.post("/meeting", {
          query: {
            room: remotePeerIdValue,
            mode: "broadcast",
          }
        });
  
        if (response.data.data) {
          setBroadcastUser(response.data.data.createdBy);
          setMode("broadcast");
        } else {
          setBroadcastUser("");
          setMode("meeting");
        }
        // Get media stream
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        userStream.current = mediaStream;
        userStream.current.getAudioTracks()[0].enabled = !mute;

        // Create video element
        const video = document.createElement('video');
  
        call.answer(mediaStream);

        // Handle incoming stream
        call.on('stream', (userVideoStream) => {
          console.log("----------------------------Listener------------------------------------")
          if(peerId == broadcastUser) return
          else if(call.peer == broadcastUser && mode === "broadcast"){
            monitorAudio(userVideoStream, call.peer); // Monitor audio
            addVideoStream(video, userVideoStream)
          }
          else if(mode === "meeting"){
            // Answer the call
            monitorAudio(userVideoStream, call.peer); // Monitor audio
            addVideoStream(video, userVideoStream)
          }
        });
  
        // Update peers state
        setPeers((prevPeers) => ({ ...prevPeers, [call.peer]: call }));
      } catch (error) {
        console.error('Error handling incoming call:', error);
      }
    };

    useEffect(() => {
      // Attach the handler to the peer instance
      peerInstance.current.on('call', handleIncomingCall);
    
      // Cleanup on component unmount
      return () => {
        peerInstance.current.off('call', handleIncomingCall);
      };
    }, [remotePeerIdValue, mode, broadcastUser, mute, handleIncomingCall]); // Add dependencies as needed
  
  
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
    
    function connectToNewUser (userId, stream, mode = "meeting", createdBy) {
      // call remote peer instance    //call will listern to .on(call) method
      const call = peerInstance.current.call(userId, stream)
      const video = document.createElement('video')
      // get stream from remote and add video to existing peer instance
      console.log('connectToNewUser :>> ', call.peer);
      if(mode == "broadcast"){
        setBroadcastUser(createdBy);
        setMode("broadcast");
      }else{
        setBroadcastUser("");
        setMode("meeting");
      }
      call.on('stream', userVideoStream => {
        if(peerId==broadcastUser) return
        else if(userId==broadcastUser && mode === "broadcast"){
          monitorAudio(userVideoStream, userId); // Monitor audio
          addVideoStream(video, userVideoStream)
        }
        else if(mode === "meeting"){
          // Answer the call
          monitorAudio(userVideoStream, userId); // Monitor audio
          addVideoStream(video, userVideoStream)
        }
      })
      call.on('close', () => {
        video.remove()
      })
      setPeers((prevPeers) => ({ ...prevPeers, [userId]: call }));
  
    }
    const disconnectedPeers = (userId) => {
      console.log('peers :>> ', peers); 
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
            
            let audioContext = new AudioContext();
            // Create audio sources
            const micSource = audioContext.createMediaStreamSource(mediaStream);

             // Create an empty destination node to merge streams
            const destination = audioContext.createMediaStreamDestination();

             // If a music stream exists, merge it
            if (peerId == "ykp") {
                console.log("Music Available")
                const audioElement = new Audio(demoSoundUrl);
                audioElement.crossOrigin = "anonymous";
                audioElement.volume = 1.0; // Set volume (adjustable)
                audioContextRef.current = audioElement;
                audioElement.play();
                audioElement.loop = true; // Loop the music
                audioElement.volume = 0.1; // Set volume (adjustable)
                audioElement.muted = false; // Set muted
                let musicSource = audioContext.createMediaElementSource(audioElement);
                musicSource.connect(destination);
            }else{
              console.log("Music not Available")
            }
            
            // Connect microphone stream to the destination
            micSource.connect(destination);

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

            socketRef.current.emit('join-room', remotePeerId, peerId, mode);
            
            console.log('destination.stream :>> ', destination.stream); 
            socketRef.current.on('user-connected', ({userId, mode, createdBy}) => {
              // connectToNewUser(userId, mediaStream, mode, createdBy)
              connectToNewUser(userId, destination.stream, mode, createdBy)
            })

            socketRef.current.on('mute-status', ({peerId, isMuted}) => {
              setUsersMute((prev)=> ({
                ...prev,
                [peerId]: isMuted
              })) 
            })
  
            socketRef.current.on('leave-room', userId => {
              console.log('leave-room :>> ', userId); 
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
            { !joined &&
              <select 
                disabled={!!getFromURL}
                value={mode} 
                onChange={(e) => setMode(e.target.value)} 
                className="bg-white border border-gray-300 rounded-md p-2 ml-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="meeting">Meeting</option>
                <option value="broadcast">Broadcast</option>
              </select>
            }
          </div>
  
          <div className='flex justify-center'>
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
            {/* <button onClick={handleConnectClick}>Start Call with Music</button> */}
          </div>
          <div className="space-y-4 mt-6">
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
          </div>
          {Object.keys(peers).length === 0 && joined && (
            <p className="text-center text-gray-500 mt-8">Waiting for other users to join...</p>
          )}
          {peerId=="ykp" && 
          <div ref={audioContextRef} style={{ marginTop: '20px' }}>
          </div>}
            
          <div id="video-grid" ref={videoGridRef} className='hidden' ></div>
        </div>
      </div>
    );
}

export default AudioStream
