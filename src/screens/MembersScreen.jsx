import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import GradientHeader from '../components/GradientHeader';
import MemberRow from '../components/MemberRow';
import PrimaryButton from '../components/PrimaryButton';

const MembersScreen = () => {
  const navigate = useNavigate();
  const { currentRoom, members, addMember, removeMember, loading } = useRoom();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddMember = async () => {
    if (newMemberName.trim() && !saving) {
      setSaving(true);
      try {
        await addMember(newMemberName.trim());
        setNewMemberName('');
        setShowAddForm(false);
      } catch (err) {
        console.error('Error adding member:', err);
        alert('Failed to add member. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (window.confirm(`Remove ${memberName} from this room? Their expense history will remain.`)) {
      try {
        await removeMember(memberId);
      } catch (err) {
        console.error('Error removing member:', err);
        alert('Failed to remove member. Please try again.');
      }
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!currentRoom) {
    return (
      <div className="min-h-screen pb-20">
        <GradientHeader title="Members" />
        <div className="px-4 py-6 text-center">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-gray-500 mb-4">Please select a room first</p>
          <PrimaryButton variant="gradient" onClick={() => navigate('/')}>
            Go to Home
          </PrimaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <GradientHeader title="Members" />

      <div className="px-4 py-6">
        {/* Room Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm text-gray-500">Room</p>
          <p className="font-semibold text-gray-900">{currentRoom.name}</p>
          <p className="text-sm text-gray-500 mt-1">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Members List */}
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-gray-500 mb-4">No members yet. Add your roommates to start splitting expenses!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                name={member.name}
                initials={getInitials(member.name)}
                rightContent={
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    className="px-3 py-1.5 text-sm text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                }
              />
            ))}
          </div>
        )}

        {/* Add Member Form */}
        {!showAddForm ? (
          <PrimaryButton
            variant="outline"
            fullWidth
            onClick={() => setShowAddForm(true)}
          >
            + Add Member
          </PrimaryButton>
        ) : (
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <p className="font-medium text-gray-900">Add New Member</p>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Enter member name"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-orange"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddMember();
              }}
            />
            <div className="flex gap-3">
              <PrimaryButton
                variant="outline"
                fullWidth
                onClick={() => {
                  setShowAddForm(false);
                  setNewMemberName('');
                }}
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                variant="gradient"
                fullWidth
                onClick={handleAddMember}
                disabled={!newMemberName.trim() || saving}
              >
                {saving ? 'Adding...' : 'Add'}
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 rounded-2xl p-4">
          <h4 className="font-medium text-blue-900 mb-2">💡 Tip</h4>
          <p className="text-sm text-blue-700">
            Add all the people who share expenses in this room. You can always add or remove members later.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MembersScreen;
