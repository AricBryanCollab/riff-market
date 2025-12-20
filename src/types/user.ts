export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  theme: string;
  phone: string | null;
  profilePic: string | null;
  address: string | null;
};
