import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { setUserData } from '../store/authSlice';

function UsernameInput() {
    const [usernameInput, setUsernameInput] = useState("");
    const dispatch = useDispatch();
    // Function to handle the form submission to set userData
    const handleUsernameSubmit = (e) => {
        e.preventDefault();
        if (usernameInput.trim()) {
            const user = { username: usernameInput };  // Mock user data
            dispatch(setUserData(user));  // Dispatch the user data to Redux
        }
    };
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Enter Your Username</h2>
      <form onSubmit={handleUsernameSubmit} className="flex flex-col space-y-4">
        <input
          type="text"
          onChange={(e) => setUsernameInput(e.target.value)}
          placeholder="Enter your username"
          className="bg-gray-200 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          required
        />
        <button
          type="submit"
          className="bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-50"
        >
          Join Room
        </button>
      </form>
    </div>
  </div>
  )
}

export default UsernameInput
