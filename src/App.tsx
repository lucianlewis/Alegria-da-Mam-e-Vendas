import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Entries } from './components/Entries';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { NewSale } from './components/NewSale';
import { Sale, Goal } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('home');
  const [showNewSale, setShowNewSale] = useState(false);

  // Fetch sales
  const salesQuery = query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(50));
  const [salesData, salesLoading] = useCollectionData(salesQuery);

  // Fetch goals (mocking some initial data if empty)
  const goalsQuery = query(collection(db, 'goals'));
  const [goalsData, goalsLoading] = useCollectionData(goalsQuery);

  const sales = (salesData || []) as Sale[];
  const goals = (goalsData || [
    { id: '1', title: 'Monthly Sales Goal', target: 5000, current: 4250, status: 'on-track' }
  ]) as Goal[];

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (showNewSale) {
    return (
      <NewSale 
        onBack={() => setShowNewSale(false)} 
        onSuccess={() => setShowNewSale(false)} 
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard sales={sales} goals={goals} />;
      case 'entries':
        return <Entries sales={sales} />;
      case 'history':
        return <History sales={sales} />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard sales={sales} goals={goals} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onPlusClick={() => setShowNewSale(true)}
    >
      {renderContent()}
    </Layout>
  );
}

