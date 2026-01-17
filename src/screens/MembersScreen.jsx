import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';

const MembersScreen = () => {
  const navigate = useNavigate();
  const { members, addMember, deleteMember, loading } = useRoom();
  
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showInput, setShowInput] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim() || adding) return;
    setAdding(true);
    try {
      await addMember(newName.trim());
      setNewName('');
      setShowInput(false);
    } catch (err) {
      console.error('Error adding member:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (memberId) => {
    if (deleting) return;
    setDeleting(memberId);
    try {
      await deleteMember(memberId);
    } catch (err) {
      console.error('Error deleting member:', err);
    } finally {
      setDeleting(null);
    }
  };

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
            {/* Add Member */}
            {!showInput ? (
              <button
                onClick={() => setShowInput(true)}
                className="w-full flex items-center gap-3 p-4 bg-surface rounded-card shadow-card mb-4 border-2 border-dashed border-divider hover:border-primary/30 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7A45" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-primary">Add Member</span>
              </button>
            ) : (
              <div className="bg-surface rounded-card shadow-card p-4 mb-4">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder="Enter member name"
                  className="w-full h-12 px-4 bg-background border border-divider rounded-card text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 mb-3"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowInput(false); setNewName(''); }}
                    className="flex-1 h-11 rounded-button border border-divider text-text-secondary text-sm font-medium hover:bg-background transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newName.trim() || adding}
                    className="flex-1 h-11 rounded-button bg-primary text-white text-sm font-medium disabled:opacity-50"
                  >
                    {adding ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            )}

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
                <p className="text-xs text-text-muted">Add people to start splitting expenses</p>
              </div>
            ) : (
              <div className="bg-surface rounded-card shadow-card divide-y divide-divider overflow-hidden">
                {members.map((member, index) => (
                  <div key={member.id} className="flex items-center gap-3 p-4">
                    <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 text-sm font-medium text-text-primary">{member.name}</span>
                    <button
                      onClick={() => handleDelete(member.id)}
                      disabled={deleting === member.id}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-text-muted hover:bg-error-light hover:text-error transition-colors disabled:opacity-50"
                    >
                      {deleting === member.id ? (
                        <div className="w-4 h-4 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      )}
                    </button>
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
