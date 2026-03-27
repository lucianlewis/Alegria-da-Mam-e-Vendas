import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData, useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, limit, doc, getDoc, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Entries } from './components/Entries';
import { History } from './components/History';
import { Profile } from './components/Profile';
import { ProfileEdit } from './components/ProfileEdit';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { AccountDeletion } from './components/AccountDeletion';
import { NewSale } from './components/NewSale';
import { SellersList } from './components/SellersList';
import { EditSeller } from './components/EditSeller';
import { SellerPerformance } from './components/SellerPerformance';
import { CashMovement } from './components/CashMovement';
import { PaymentMethodDetail } from './components/PaymentMethodDetail';
import { CashSession } from './components/CashSession';
import { useLanguage } from './contexts/LanguageContext';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { EntriesSkeleton } from './components/EntriesSkeleton';
import { HistorySkeleton } from './components/HistorySkeleton';
import { ProfileSkeleton } from './components/ProfileSkeleton';
import { Sale, Goal, Seller, CashMovementType, CashMovement as CashMovementInterface, CashSession as CashSessionInterface } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { t } = useLanguage();
  const [user, loading, error] = useAuthState(auth);
  const [userData, setUserData] = useState<any>(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showNewSale, setShowNewSale] = useState(false);
  const [showCashMovement, setShowCashMovement] = useState(false);
  const [cashMovementType, setCashMovementType] = useState<CashMovementType>('sangria');
  const [view, setView] = useState<'main' | 'sellers' | 'edit-seller' | 'performance' | 'cash-session' | 'profile-edit' | 'privacy-policy' | 'terms-of-service' | 'account-deletion'>('main');
  const [selectedSeller, setSelectedSeller] = useState<Seller | undefined>();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const isAdmin = user?.email === 'mahteusmachado@gmail.com' || userData?.role === 'admin';

  // Fetch current open cash session
  const cashSessionsQuery = useMemo(() => {
    if (!user || userDataLoading) return null;
    return query(
      collection(db, 'cashSessions'), 
      where('userId', '==', user.uid),
      where('status', '==', 'open'),
      limit(1)
    );
  }, [user, userDataLoading]);
  const [sessionsSnapshot, sessionsLoading] = useCollection(cashSessionsQuery);
  const currentSession = sessionsSnapshot && !sessionsSnapshot.empty 
    ? { id: sessionsSnapshot.docs[0].id, ...sessionsSnapshot.docs[0].data() } as CashSessionInterface 
    : null;

  // Ensure user document exists
  useEffect(() => {
    if (user) {
      setUserDataLoading(true);
      const userRef = doc(db, 'users', user.uid);
      getDoc(userRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setUserDataLoading(false);
        } else {
          const newUserData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: user.email === 'mahteusmachado@gmail.com' ? 'admin' : 'seller',
            language: localStorage.getItem('app_language') || 'en',
            createdAt: serverTimestamp()
          };
          setDoc(userRef, newUserData)
            .then(() => {
              setUserData(newUserData);
              setUserDataLoading(false);
            })
            .catch(err => {
              console.error("Error creating user doc:", err);
              setUserDataLoading(false);
            });
        }
      }).catch(err => {
        console.error("Error fetching user doc:", err);
        setUserDataLoading(false);
      });
    } else {
      setUserData(null);
      setUserDataLoading(false);
    }
  }, [user]);

  // Fetch sales - Global query for admin, scoped for sellers
  const salesQuery = useMemo(() => {
    if (!user || userDataLoading) return null;
    const base = collection(db, 'sales');
    if (isAdmin) {
      return query(base, orderBy('timestamp', 'desc'));
    }
    return query(base, 
      where('sellerId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
  }, [user, isAdmin, userDataLoading]);
  const [salesData, salesLoading] = useCollectionData(salesQuery);

  // Fetch cashMovements - Global for admin, scoped for sellers
  const cashMovementsQuery = useMemo(() => {
    if (!user || userDataLoading) return null;
    const base = collection(db, 'cashMovements');
    if (isAdmin) {
      return query(base, orderBy('timestamp', 'desc'));
    }
    return query(base, 
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
  }, [user, isAdmin, userDataLoading]);
  const [cashMovementsData, cashMovementsLoading] = useCollectionData(cashMovementsQuery);

  // Fetch goals - Global as per rules (allow read: if isAuthenticated)
  const goalsQuery = useMemo(() => {
    if (!user || userDataLoading) return null;
    return query(collection(db, 'goals'));
  }, [user, userDataLoading]);
  const [goalsData, goalsLoading] = useCollectionData(goalsQuery);

  // Fetch sellers - Global as per rules (allow read: if isAuthenticated)
  const sellersQuery = useMemo(() => {
    if (!user || userDataLoading) return null;
    return query(collection(db, 'sellers'), orderBy('name', 'asc'));
  }, [user, userDataLoading]);
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

  const isInitialLoading = loading || salesLoading || sellersLoading || goalsLoading || cashMovementsLoading || sessionsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="text-slate-500 text-sm font-bold animate-pulse">
            {t('loadingData')}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderSkeleton = () => {
    switch (activeTab) {
      case 'home':
        return <DashboardSkeleton />;
      case 'entries':
        return <EntriesSkeleton />;
      case 'history':
        return <HistorySkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      default:
        return <DashboardSkeleton />;
    }
  };

  if (isInitialLoading) {
    return (
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onPlusClick={() => {}}
        onSangriaClick={() => {}}
        onReforcoClick={() => {}}
      >
        {renderSkeleton()}
      </Layout>
    );
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
        sales={sales}
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

  if (view === 'cash-session') {
    return (
      <CashSession 
        currentSession={currentSession}
        allSales={sales}
        allMovements={cashMovements}
        onBack={() => setView('main')}
        onSuccess={() => {
          setView('main');
          setActiveTab('home');
        }}
      />
    );
  }

  if (view === 'profile-edit') {
    return (
      <ProfileEdit 
        onBack={() => setView('main')} 
      />
    );
  }

  if (view === 'privacy-policy') {
    return (
      <PrivacyPolicy 
        onBack={() => setView('main')} 
      />
    );
  }

  if (view === 'terms-of-service') {
    return (
      <TermsOfService 
        onBack={() => setView('main')} 
      />
    );
  }

  if (view === 'account-deletion') {
    return (
      <AccountDeletion 
        onBack={() => setView('main')} 
        sales={sales}
        cashMovements={cashMovements}
        onProfileEdit={() => setView('profile-edit')}
      />
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Dashboard 
            sales={sales} 
            goals={goals} 
            sellers={sellers} 
            isSessionOpen={!!currentSession}
            onCashSessionClick={() => setView('cash-session')}
          />
        );
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
        return <History sales={sales} cashMovements={cashMovements} goals={goals} sellers={sellers} />;
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
            onEditProfile={() => setView('profile-edit')}
            onViewPrivacy={() => setView('privacy-policy')}
            onViewTerms={() => setView('terms-of-service')}
            onDeleteAccount={() => setView('account-deletion')}
          />
        );
      default:
        return (
          <Dashboard 
            sales={sales} 
            goals={goals} 
            sellers={sellers} 
            isSessionOpen={!!currentSession}
            onCashSessionClick={() => setView('cash-session')}
          />
        );
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

