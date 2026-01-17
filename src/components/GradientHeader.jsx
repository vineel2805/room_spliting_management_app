import React from 'react';

const GradientHeader = ({ title, rightIcon, onRightClick, subtitle }) => {
  return (
    <div className="bg-surface px-5 pt-12 pb-4 border-b border-divider">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold text-text-primary">{title}</h1>
          {subtitle && (
            <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
        {rightIcon && (
          <button
            onClick={onRightClick}
            className="h-9 px-4 rounded-full bg-background text-text-secondary text-xs font-medium hover:bg-divider transition-colors flex items-center justify-center"
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
};

export default GradientHeader;
