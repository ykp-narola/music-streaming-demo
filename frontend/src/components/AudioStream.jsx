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
import AudioPlayerSection from './AudioPlayerSection';

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
    const [volume, setVolume] = useState(1); // Default volume is 100%
    const [musicUrl, setMusicUrl] = useState(''); // To hold the selected URL
    const [musicList, setMusicList] = useState([]); // To hold the list of music from API
    let musicSource = useRef(null);
    const audioContext = useRef(null);
    // Fetch music list from API on component mount
    useEffect(() => {
      const fetchMusicList = async () => {
        try {
          const response = await axios.get("/music"); 
          if (response.data) {
            setMusicList(response.data); 
            setMusicUrl(`${base.URL}/${response.data[0].filePath}`); 
          }
        } catch (error) {
          console.error("Error fetching music list:", error);
        }
      };

      fetchMusicList();
    }, []);

    useEffect(() => {
      // Create AudioContext on component mount and cleanup on unmount
      audioContext.current = new AudioContext();
  
      return () => {
        if (audioContext.current) {
          audioContext.current.close();
        }
      };
    }, []);

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

    useEffect(() => {
      if (audioRef.current && musicUrl) {
        audioRef.current.src = musicUrl; // Set the audio source to the selected URL
        audioRef.current.play(); // Play the new sound when selected
      }
    }, [musicUrl]);
  
    // Update the current time during playback
    useEffect(() => {
      if (audioRef.current) {
        const handleTimeUpdate = () => {
          setCurrentTime(audioRef.current.currentTime);
        };
        audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
        return () => {
          audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
        };
      }
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        let intervalId;
        if (musicSource.current) {
          musicSource.current.disconnect();
        }
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
            audio?.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio?.removeEventListener('timeupdate', handleTimeUpdate);
            if (musicSource.current) {
              musicSource.current.disconnect();
            }
            clearInterval(intervalId);
          };
        }
    }, [audioRef.current]);

    useEffect(() => {
      // Attach the handler to the peer instance
      peerInstance.current.on('call', handleIncomingCall);
    
      // Cleanup on component unmount
      return () => {
        peerInstance.current.off('call', handleIncomingCall);
      };
    }, [remotePeerIdValue, mode, broadcastUser, mute, handleIncomingCall]); // Add dependencies as needed
  
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

    // Function to handle demo sound URL changes
    const handleSoundChange = (e) => {
      const selectedUrl = e.target.value;
      setMusicUrl(selectedUrl);
      if (audioRef.current) {
        audioRef.current.src = selectedUrl;
        audioRef.current.play(); // Play the newly selected sound
      }
    };

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
    async function handleIncomingCall (call) {
      try {    
        console.log('handleIncomingCall from :>> ', peerId); 
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

        // const audioContext = new AudioContext();
        // Create audio sources
        const micSource = audioContext.current.createMediaStreamSource(mediaStream);

        // Create an empty destination node to merge streams
        const destination = audioContext.current.createMediaStreamDestination();

         // If a music stream exists, merge it
         if (peerId == broadcastUser) {
            console.log("Music Available")
            const audioElement = audioRef.current || new Audio(musicUrl);
            audioRef.current = audioElement;
            audioRef.current.crossOrigin = "anonymous";
            audioRef.current.loop = true; // Loop the music
            audioRef.current.volume = volume; // Set volume (adjustable)
            audioRef.current.muted = false; // Set muted
            audioRef.current.play();
            audioRef.current.onloadedmetadata = () => {
                audioRef.current.play(); // Ensure real-time playback
            };
            // Check if the audio element is already connected to an AudioContext
            // if (!audioRef.currentSource) {
              if(!musicSource.current){
                musicSource.current = audioContext.current.createMediaElementSource(audioRef.current);
              }else{
                musicSource.current.connect(destination);
              }

              // }
              // audioRef.currentSource = musicSource.current; // Store reference to the source node
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
  
    const monitorAudio = (audioStream, peerId) => {
      // const audioContext = new AudioContext();
      const analyser = audioContext.current.createAnalyser();
      const source = audioContext.current.createMediaStreamSource(audioStream);
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
        // if (peerId !== broadcastUser && mode === "broadcast") {
        //   monitorAudio(userVideoStream, userId);
        //   addVideoStream(video, userVideoStream);
        // }
      })
      call.on('close', () => {
        video.remove()
      })
      setPeers((prevPeers) => ({ ...prevPeers, [userId]: call }));
  
    }

    function cleanupAudioContext() {
      if (audioRef.current && audioRef.currentSource) {
        audioRef.currentSource.disconnect(); // Disconnect the previous source
        audioRef.currentSource = null; // Clear the reference
      }
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
            console.log('calling from:>> ', peerId); 
            // const audioContext = new AudioContext();
            // Create audio sources
            const micSource = audioContext.current.createMediaStreamSource(mediaStream);

             // Create an empty destination node to merge streams
            const destination = audioContext.current.createMediaStreamDestination();

             // If a music stream exists, merge it
            if (peerId == broadcastUser) {
                console.log("Music Available")
                const audioElement = audioRef.current || new Audio(musicUrl);
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
        
                // if (!audioRef.currentSource) {
                   if(!musicSource.current){
                     musicSource.current = audioContext.current.createMediaElementSource(audioRef.current);
                    }else{
                     musicSource.current.connect(destination);
                    }
                  // audioRef.currentSource = musicSource.current; // Store reference to the source node
                // }
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
        // cleanupAudioContext();
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
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-white p-4 md:p-6 rounded-lg shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 text-center">
          Audio Meeting Room
        </h2>
    
        {peerId === broadcastUser && (
          <div className="flex flex-col md:flex-row justify-center mb-6">
            <label className="mb-2 md:mb-0 mr-0 md:mr-4">Select Music:</label>
            <select
              value={musicUrl}
              onChange={handleSoundChange}
              className="bg-white border border-gray-300 rounded-md p-2 text-gray-700 w-full md:w-auto"
            >
              {musicList.map((music, index) => (
                <option key={index} value={`${base.URL}/${music.filePath}`}>
                  {music.title || `Track ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
    
        {/* User ID and Copy Room ID Section */}
        <div className="flex flex-col md:flex-row items-center mb-6 justify-center space-y-4 md:space-y-0">
          <p className="text-gray-600">
            User ID:
            <span className="font-mono bg-gray-200 p-1 rounded ml-2">{peerId}</span>
          </p>
          <button
            onClick={copyToClipboard}
            className="ml-2 text-cyan-500 hover:text-cyan-700 focus:outline-none"
            title="Copy Room ID"
          >
            <FaRegCopy className="h-5 w-5" />
          </button>
    
          {!joined && (
            <select
              disabled={!!getFromURL}
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="bg-white border border-gray-300 rounded-md p-2 mt-4 md:mt-0 ml-0 md:ml-4 text-gray-700 w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="meeting">Meeting</option>
              <option value="broadcast">Broadcast</option>
            </select>
          )}
        </div>
    
        {/* Input Stream Section */}
        <div className="flex justify-center">
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
            broadcastUser={broadcastUser}
            mode={mode}
            peerId={peerId}
          />
        </div>
    
        {/* Audio Player Section */}
        <AudioPlayerSection
          peerId={peerId}
          broadcastUser={broadcastUser}
          togglePlayPause={togglePlayPause}
          isPlaying={isPlaying}
          duration={duration}
          currentTime={currentTime}
          handleSeek={handleSeek}
          volume={volume}
          handleVolumeChange={handleVolumeChange}
          audioRef={audioRef}
          soundUrl={musicUrl}
        />

        {/* User List Section */}
        <div className="space-y-4 mt-6">
          <UserList
            peers={peers}
            speakerVolume={speakerVolume}
            usersMute={usersMute}
            broadcastUser={broadcastUser}
            joined={joined}
          />
        </div>
    
    
        {/* Hidden Video Grid */}
        <div id="video-grid" ref={videoGridRef} className="hidden"></div>
      </div>
    </div>
      
    );
}

export default AudioStream
