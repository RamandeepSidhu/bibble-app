'use client';

import { NextPage } from 'next';
import { SessionProvider } from 'next-auth/react';
import React from 'react';

interface Props {
  children: React.ReactNode;
  session: any
}
const AuthProvider: NextPage<Props> = ({ children,session }) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default AuthProvider;
