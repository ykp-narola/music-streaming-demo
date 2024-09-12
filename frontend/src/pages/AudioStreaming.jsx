import React from 'react'
import AudioStream from '../components/AudioStream';
import { useParams } from 'react-router-dom';
import UsernameInput from '../components/UsernameInput';
import { useSelector } from 'react-redux';
function AudioStreaming() {
  const params = useParams();
  let userData = useSelector(state => state.auth.userData)
  return (
    <div>
      {!userData ? <UsernameInput /> : <AudioStream stream={params.stream} />
    }
  </div>
  )
}

export default AudioStreaming
