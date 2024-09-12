import React from 'react'
import AudioStream from '../components/AudioStream';
import { useParams } from 'react-router-dom';
import UsernameInput from '../components/UsernameInput';
import { useDispatch, useSelector } from 'react-redux';
function AudioStreaming() {
  const params = useParams();
  let userData = useSelector(state => state.auth.userData)
  const dispatch = useDispatch();
  console.log('userData :>> ', userData); 
  return (
    <div>
      {!userData ? <UsernameInput /> : <AudioStream stream={params.stream} />
    }
  </div>
  )
}

export default AudioStreaming
