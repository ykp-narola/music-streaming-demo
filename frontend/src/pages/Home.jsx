import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MusicList from './MusicList';

const Home = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Dummy author list
  const authors = [
    { id: 1, name: 'Author 1' },
    { id: 2, name: 'Author 2' },
    { id: 3, name: 'Author 3' },
    { id: 4, name: 'Author 4' },
  ];

  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

  return (
    <div className="relative flex">
      <Sidebar authors={authors} isVisible={sidebarVisible} />
      <div className={`flex-1 p-6 transition-all duration-300 
        ${sidebarVisible ? 'mr-64' : ''}`}
      >
        <MusicList />
      </div>
      <button
        onClick={toggleSidebar}
        className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      >
        {sidebarVisible ? 'Hide Authors' : 'Show Authors'}
      </button>
    </div>
  );
};

export default Home;
