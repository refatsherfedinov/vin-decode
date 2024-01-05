import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import TrafficPolicePage from './pages/TrafficPolicePage';
import DealerPage from './pages/DealerPage';
import AdminPage from './pages/AdminPage';
import InsuranceCompanyPage from './pages/InsuranceCompanyPage';
import { SmartContractProvider } from './components/ContractContext/ContractContext';
import Header from './components/Header/Header';
function App() {
    return (
        <div>
            <SmartContractProvider>
                <Router>
                    <Header />
                    <Routes>
                        <Route path='/' element={<HomePage />} />
                        <Route path='/admin' element={<AdminPage />} />
                        <Route path='/dealer' element={<DealerPage />} />
                        <Route
                            path='/traffic'
                            element={<TrafficPolicePage />}
                        />
                        <Route
                            path='/insurance'
                            element={<InsuranceCompanyPage />}
                        />
                    </Routes>
                </Router>
            </SmartContractProvider>
        </div>
    );
}

export default App;
