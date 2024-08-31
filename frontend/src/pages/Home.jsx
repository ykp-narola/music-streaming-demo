import React from 'react';
import SongList from '../components/Songs';
import MusicList from './MusicList';

const Home = () => (
  <div>
    <h2>Welcome to Music Streaming</h2>
    {/* <SongList /> */}
    <MusicList />
  </div>
);

export default Home;
