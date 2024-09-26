import { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';
import io from 'socket.io-client'; // Make sure you have this installed
import { FaRegCopy, FaBroadcastTower } from "react-icons/fa";
import { FiMicOff, FiMic } from "react-icons/fi";
import { base } from '../utils/config';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from '../services/api';
import UserList from './UserList';
import InputStream from './InputStream';

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
    // const audioContextRef = useRef(null);
    const audioRef = useRef(null); 
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0); // Track the current audio time
    const [duration, setDuration] = useState(0);  
    const demoSoundUrl = "http://192.168.1.241:5001/uploads/music/1725015358640.mp3"; 
    const [volume, setVolume] = useState(1); // Default volume is 100%

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
  
     // Update the current time for local playback when dragging the seek bar
     const handleSeek = (e) => {
        const seekTime = Number(e.target.value);
        setCurrentTime(seekTime);
        if (audioRef.current) {
          audioRef.current.currentTime = seekTime;
        }
      };

      const handleVolumeChange = (e) => {
        const newVolume = Number(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
          audioRef.current.volume = newVolume; // Set the audio volume
        }
      };

    useEffect(() => {
        const audio = audioRef.current;
        let intervalId;
    
        if (audio) {
          const handleLoadedMetadata = () => {
            setDuration(audio.duration);
          };
    
          const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
          };
    
          audio.addEventListener('loadedmetadata', handleLoadedMetadata);
          audio.addEventListener('timeupdate', handleTimeUpdate);
    
          intervalId = setInterval(() => {
            if (!audio.paused) {
              setCurrentTime(audio.currentTime);
            }
          }, 1000);
    
          return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            clearInterval(intervalId);
          };
        }
      }, [audioRef.current]);
  // Update the current time during playback
  useEffect(() => {
    if (audioRef.current) {
      const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
      };
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;
  
    // Ensure audioRef.current is defined before attaching events
    if (audioElement) {
      const handleLoadedMetadata = () => {
        setDuration(audioElement.duration);  // Set the audio duration dynamically
      };
  
      // Attach the 'loadedmetadata' event
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
  
      // Cleanup on unmount
      return () => {
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [audioRef.current]);


  // Play/pause the local audio playback
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();  // Only pause for local user
      } else {
        audioRef.current.play();   // Resume local user playback
      }
      setIsPlaying(!isPlaying);
    }
  };

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

        let audioContext = new AudioContext();
        // Create audio sources
        const micSource = audioContext.createMediaStreamSource(mediaStream);

        // Create an empty destination node to merge streams
        const destination = audioContext.createMediaStreamDestination();
        
         // If a music stream exists, merge it
         if (peerId == broadcastUser) {
            console.log("Music Available")
            const audioElement = new Audio(demoSoundUrl);
            audioRef.current = audioElement;
            audioRef.current.crossOrigin = "anonymous";
            audioRef.current.volume = volume; // Set volume (adjustable)
            // audioContextRef.current = audioRef.current;
            audioRef.current.loop = true; // Loop the music
            audioRef.current.muted = false; // Set muted
            audioRef.current.play();
            audioRef.current.onloadedmetadata = () => {
                audioRef.current.play(); // Ensure real-time playback
            };
            let musicSource = audioContext.createMediaElementSource(audioRef.current);
            musicSource.connect(destination);
        }else{
          console.log("Music not Available")
        }
        
        micSource.connect(destination);
        call.answer(destination.stream);

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
      if(!peerInstance.current._open && window.confirm('Your session is already active in another account. kindly do hard reload')) {
        return navigate("/audio-stream")
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
            if (peerId == broadcastUser) {
                console.log("Music Available")
                const audioElement = new Audio(demoSoundUrl);
                audioRef.current = audioElement;
                audioRef.current.crossOrigin = "anonymous";
                // audioContextRef.current = audioRef.current;
                audioRef.current.loop = true; // Loop the music
                audioRef.current.volume = volume; // Set volume (adjustable)
                audioRef.current.muted = false; // Set muted
                audioRef.current.play();
                audioRef.current.onloadedmetadata = () => {
                    audioRef.current.play(); // Ensure real-time playback
                };
                let musicSource = audioContext.createMediaElementSource(audioRef.current);
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

    const playAudio = () => {
        if (audioRef.current) {
            audioRef.current.play();
        }
    };
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
            <InputStream
                remotePeerIdValue={remotePeerIdValue}
                setRemotePeerIdValue={setRemotePeerIdValue}
                getFromURL={getFromURL}
                joined={joined}
                leaveChannel={leaveChannel}
                loading={loading}
                toggleMute={toggleMute}
                mute={mute}
                handleConnectClick={handleConnectClick}
                isButtonDisabled={isButtonDisabled}
            />
          </div>
          <div className="space-y-4 mt-6">
            <UserList
                peers={peers}
                speakerVolume={speakerVolume}
                usersMute={usersMute}
                broadcastUser={broadcastUser}
                joined={joined}
            />
          </div>

          {/* Audio Player Section */}
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
                    src={demoSoundUrl}
                    controls 
                    loop 
                    className="w-full mt-2 hidden"
                >
                    Your browser does not support the audio element.
                </audio>
                </div>
            )}
            <div id="video-grid" ref={videoGridRef} className='hidden' ></div>
        </div>
      </div>
    );
}

export default AudioStream
