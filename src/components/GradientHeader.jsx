import React from 'react';

const GradientHeader = ({ title, rightIcon, onRightClick }) => {
  return (
    <div className="bg-gradient-primary px-4 pt-12 pb-6 rounded-b-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-white text-2xl font-semibold">{title}</h1>
        {rightIcon && (
          <button
            onClick={onRightClick}
            className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-sm hover:bg-white/30 transition-colors"
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
};

export default GradientHeader;
