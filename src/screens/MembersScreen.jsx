import React from 'react';
import { useRoom } from '../context/RoomContext';

const MembersScreen = () => {
  const { members, loading } = useRoom();

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-surface px-5 pt-12 pb-4 border-b border-divider">
        <h1 className="text-[22px] font-semibold text-text-primary">Members</h1>
        <p className="text-xs text-text-muted mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="px-5 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-card p-4 shadow-card flex items-center gap-3">
                <div className="skeleton w-11 h-11 rounded-full" />
                <div className="skeleton h-5 w-32 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Members List */}
            {members.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FF7A45" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </div>
                <p className="text-sm text-text-secondary mb-1">No members yet</p>
                <p className="text-xs text-text-muted">Members will appear when they join the room</p>
              </div>
            ) : (
              <div className="bg-surface rounded-card shadow-card divide-y divide-divider overflow-hidden">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-4">
                    {member.photoURL ? (
                      <img 
                        src={member.photoURL} 
                        alt={member.name} 
                        className="w-11 h-11 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-text-primary block truncate">{member.name}</span>
                      {member.email && (
                        <span className="text-xs text-text-muted block truncate">{member.email}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MembersScreen;
