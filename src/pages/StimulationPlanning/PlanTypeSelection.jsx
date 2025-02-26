import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const PlanTypePage = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="grid gap-6">
        <Link to="/stimulation/contacts">
            <button className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">
            Seizure Recreation
            </button>
        </Link>
        <Link to="/stimulation/contacts">
            <button className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">
            CCEPs
            </button>
        </Link>
        <Link to="/stimulation/contacts">
            <button className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">
            Functional Mapping
            </button>
        </Link>
      </div>
    </div>
  );
};

export default PlanTypePage;
