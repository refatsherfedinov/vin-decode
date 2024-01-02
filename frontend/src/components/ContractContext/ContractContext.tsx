import React, { createContext, useContext, useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
import vinDecode from '../../abis/VinDecode.json';

// Define the type for the context value
interface ContractContextType {
    contract: Contract | null;
    isLoading: boolean;
    userAddress: string;
}

const ContractContext = createContext<ContractContextType>({
    contract: null,
    isLoading: true,
    userAddress: '',
});

export const SmartContractProvider: React.FC<any> = ({ children }) => {
    const [contract, setContract] = useState<Contract | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [userAddress, setUserAddress] = useState<string>('');

    useEffect(() => {
        const initContract = async () => {
            if (!window.ethereum) {
                alert('Please install MetaMask!');
                return;
            }

            try {
                const provider = new ethers.providers.Web3Provider(
                    (window as any).ethereum
                );
                const signer = provider.getSigner();
                const deployedContract = new ethers.Contract(
                    process.env.REACT_APP_CONTRACT_ADDRESS as string,
                    vinDecode.abi,
                    signer
                );

                const accounts = await provider.send('eth_requestAccounts', []);
                if (accounts.length > 0) {
                    setUserAddress(accounts[0]);
                }

                setContract(deployedContract);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initContract();

        const handleAccountsChanged = (accounts: string[]) => {
            setUserAddress(accounts.length > 0 ? accounts[0] : '');
        };

        (window as any).ethereum.on('accountsChanged', handleAccountsChanged);

        return () => {
            (window as any).ethereum.removeListener(
                'accountsChanged',
                handleAccountsChanged
            );
        };
    }, []);

    return (
        <ContractContext.Provider value={{ contract, isLoading, userAddress }}>
            {children}
        </ContractContext.Provider>
    );
};

export const useSmartContract = () => useContext(ContractContext).contract;
export const useConnect = () => useContext(ContractContext).isLoading;
export const useUserAddress = () => useContext(ContractContext).userAddress;
