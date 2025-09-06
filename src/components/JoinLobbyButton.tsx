import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const JoinLobbyButton = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleJoinLobby = () => {
    if (inviteCode.trim()) {
      navigate(`/join/${inviteCode.trim()}`);
      setOpen(false);
      setInviteCode('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">Join a Lobby</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Lobby</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Invite Code</Label>
            <Input
              id="inviteCode"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter lobby code"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inviteCode.trim()) {
                  handleJoinLobby();
                }
              }}
            />
          </div>
          <Button onClick={handleJoinLobby} disabled={!inviteCode.trim()} className="w-full">
            Join Lobby
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinLobbyButton;