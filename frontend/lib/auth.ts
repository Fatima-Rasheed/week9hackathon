import Cookies from 'js-cookie';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const getToken = (): string | undefined => Cookies.get('token');

export const getUser = (): User | null => {
  const userStr = Cookies.get('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setAuth = (token: string, user: User) => {
  Cookies.set('token', token, { expires: 7, sameSite: 'strict' });
  Cookies.set('user', JSON.stringify(user), { expires: 7, sameSite: 'strict' });
};

export const clearAuth = () => {
  Cookies.remove('token');
  Cookies.remove('user');
};

export const isAuthenticated = (): boolean => !!getToken();
