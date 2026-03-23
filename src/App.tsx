import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, limit, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Entries } from './components/Entries';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { NewSale } from './components/NewSale';
import { SellersList } from './components/SellersList';
import { EditSeller } from './components/EditSeller';
import { SellerPerformance } from './components/SellerPerformance';
import { CashMovement } from './components/CashMovement';
import { PaymentMethodDetail } from './components/PaymentMethodDetail';
import { Sale, Goal, Seller, CashMovementType, CashMovement as CashMovementInterface } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, loading, error] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('home');
  const [showNewSale, setShowNewSale] = useState(false);
  const [showCashMovement, setShowCashMovement] = useState(false);
  const [cashMovementType, setCashMovementType] = useState<CashMovementType>('sangria');
  const [view, setView] = useState<'main' | 'sellers' | 'edit-seller' | 'performance'>('main');
  const [selectedSeller, setSelectedSeller] = useState<Seller | undefined>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  // Ensure user document exists
  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnap) => {
        if (!docSnap.exists()) {
          setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.email === 'mahteusmachado@gmail.com' ? 'admin' : 'seller',
            createdAt: serverTimestamp()
          }).catch(err => console.error("Error creating user doc:", err));
        }
      });
    }
  }, [user]);

  // Fetch sales
  const salesQuery = query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(50));
  const [salesData, salesLoading] = useCollectionData(salesQuery);

  // Fetch cashMovements
  const cashMovementsQuery = query(collection(db, 'cashMovements'), orderBy('timestamp', 'desc'), limit(50));
  const [cashMovementsData, cashMovementsLoading] = useCollectionData(cashMovementsQuery);

  // Fetch goals (mocking some initial data if empty)
  const goalsQuery = query(collection(db, 'goals'));
  const [goalsData, goalsLoading] = useCollectionData(goalsQuery);

  // Fetch sellers
  const sellersQuery = query(collection(db, 'sellers'), orderBy('name', 'asc'));
  const [sellersSnapshot, sellersLoading] = useCollection(sellersQuery);

  const sales = (salesData || []) as Sale[];
  const cashMovements = (cashMovementsData || []) as CashMovementInterface[];
  const goals = (goalsData || [
    { id: '1', title: 'Monthly Sales Goal', target: 5000, current: 4250, status: 'on-track' }
  ]) as Goal[];
  
  const sellers = (sellersSnapshot?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) || []) as Seller[];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center transition-colors duration-300">
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

  if (showCashMovement) {
    return (
      <CashMovement 
        type={cashMovementType}
        onBack={() => setShowCashMovement(false)}
        onSuccess={() => setShowCashMovement(false)}
      />
    );
  }

  if (view === 'sellers') {
    return (
      <SellersList 
        sellers={sellers}
        onBack={() => setView('main')}
        onAddSeller={() => {
          setSelectedSeller(undefined);
          setView('edit-seller');
        }}
        onEditSeller={(seller) => {
          setSelectedSeller(seller);
          setView('edit-seller');
        }}
        onViewPerformance={(seller) => {
          setSelectedSeller(seller);
          setView('performance');
        }}
      />
    );
  }

  if (view === 'performance' && selectedSeller) {
    return (
      <SellerPerformance 
        seller={selectedSeller}
        onBack={() => {
          if (activeTab === 'entries' || activeTab === 'profile') {
            setView('main');
          } else {
            setView('sellers');
          }
        }}
      />
    );
  }

  if (view === 'edit-seller') {
    return (
      <EditSeller 
        seller={selectedSeller}
        onBack={() => setView('sellers')}
        onSuccess={() => setView('sellers')}
      />
    );
  }

  if (selectedPaymentMethod) {
    return (
      <PaymentMethodDetail
        method={selectedPaymentMethod}
        sales={sales}
        cashMovements={cashMovements}
        onBack={() => setSelectedPaymentMethod(null)}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard sales={sales} goals={goals} sellers={sellers} />;
      case 'entries':
        return (
          <Entries 
            sales={sales} 
            sellers={sellers}
            onViewPerformance={(seller) => {
              setSelectedSeller(seller);
              setView('performance');
            }}
            onViewMethodDetail={setSelectedPaymentMethod}
          />
        );
      case 'history':
        return <History sales={sales} cashMovements={cashMovements} goals={goals} />;
      case 'profile':
        return (
          <Profile 
            onNavigateSellers={() => setView('sellers')} 
            onViewPerformance={() => {
              // If admin, maybe go to sellers list, if seller, go to their own performance
              // For now, let's find the seller object for the current user
              const currentSeller = sellers.find(s => s.email === user.email);
              if (currentSeller) {
                setSelectedSeller(currentSeller);
                setView('performance');
              } else {
                setView('sellers');
              }
            }}
          />
        );
      default:
        return <Dashboard sales={sales} goals={goals} sellers={sellers} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onPlusClick={() => setShowNewSale(true)}
      onSangriaClick={() => {
        setCashMovementType('sangria');
        setShowCashMovement(true);
      }}
      onReforcoClick={() => {
        setCashMovementType('reforco');
        setShowCashMovement(true);
      }}
    >
      {renderContent()}
    </Layout>
  );
}

