import { useState, useEffect } from 'react';

export function useAdminProfile() {
  const [userData, setUserData] = useState<{ firstName: string, lastName: string, avatarUrl: string, email: string, role: string } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { getProfile } = await import("../settings/profile/actions");
        const res = await getProfile();
        if (res.success && res.data) {
          setUserData({
            firstName: res.data.firstName || '',
            lastName: res.data.lastName || '',
            avatarUrl: res.data.avatarUrl || '',
            email: res.data.email || '',
            role: res.data.role || '',
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchUserProfile();

    const handleUpdate = () => fetchUserProfile();
    window.addEventListener('profileUpdated', handleUpdate);
    return () => window.removeEventListener('profileUpdated', handleUpdate);
  }, []);

  const initials = userData?.firstName && userData?.lastName 
    ? `${userData.firstName[0].toUpperCase()}${userData.lastName[0].toUpperCase()}`
    : 'AD';

  const displayName = userData?.firstName 
    ? `${userData.firstName} ${userData.lastName}`
    : 'Admin User';

  const displayRole = userData?.role 
    ? userData.role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) 
    : 'Administrator';

  return { userData, initials, displayName, displayRole };
}
