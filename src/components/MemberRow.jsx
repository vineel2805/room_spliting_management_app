import React from 'react';

const MemberRow = ({ 
  name, 
  initials, 
  subtitle, 
  rightContent, 
  onClick,
  avatarColor 
}) => {
  // Generate a color based on initials if not provided
  const getAvatarColor = () => {
    if (avatarColor) return avatarColor;
    const colors = [
      'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-indigo-500', 'bg-green-500', 'bg-yellow-500'
    ];
    const index = (initials.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 bg-white rounded-card ${onClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
    >
      <div className={`w-10 h-10 rounded-full ${getAvatarColor()} flex items-center justify-center text-white font-semibold text-sm`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-gray-900 truncate">{name}</p>
        {subtitle && (
          <p className="text-sm text-money-neutral truncate">{subtitle}</p>
        )}
      </div>
      {rightContent && (
        <div className="flex-shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  );
};

export default MemberRow;
