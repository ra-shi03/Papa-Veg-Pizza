import React from 'react';
import { Home } from 'lucide-react';

export default function HomePageConfig() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Home className="w-6 h-6 text-[var(--primary)]" />
          Home Page Configuration
        </h1>
        <p className="text-zinc-500 mt-1">Configure the dynamic content for the user app home screen.</p>
      </div>
      
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Home Page Settings</h3>
          <p className="text-zinc-500 max-w-sm mx-auto mt-2">This module is under development. Soon you will be able to manage banners, categories, and hot deals directly from here.</p>
        </div>
      </div>
    </div>
  );
}
