import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Wifi, WifiOff } from 'lucide-react';

const RealtimeStatus = () => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check initial connection status
    const checkConnection = () => {
      const channels = supabase.getChannels();
      setIsConnected(channels.some(channel => channel.state === 'joined'));
    };

    checkConnection();

    // Set up a periodic check for connection status
    const interval = setInterval(checkConnection, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!isConnected) return null;

  return (
    <Badge variant="outline" className="flex items-center gap-1 text-xs">
      <Wifi className="h-3 w-3 text-green-500" />
      Live
    </Badge>
  );
};

export default RealtimeStatus;