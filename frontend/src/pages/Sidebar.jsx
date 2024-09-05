import React from 'react';
import { Transition } from '@headlessui/react';

const Sidebar = ({ authors, isVisible }) => {
  return (
    <Transition
      show={isVisible}
      enter="transform transition ease-in-out duration-300"
      enterFrom="translate-x-full"
      enterTo="translate-x-0"
      leave="transform transition ease-in-out duration-300"
      leaveFrom="translate-x-0"
      leaveTo="translate-x-full"
    >
      <div className="fixed top-0 z-50 right-0 h-full w-64 bg-gray-800 text-white shadow-lg overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Authors</h2>
          <ul className="space-y-4">
            {authors.map(author => (
              <li key={author.id} className="bg-gray-700 p-4 rounded-lg shadow-md">
                <p className="text-xl font-semibold">{author.name}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Transition>
  );
};

export default Sidebar;
