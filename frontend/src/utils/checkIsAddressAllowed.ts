import { ethers } from 'ethers';
import { useLocation } from 'react-router-dom';

const useAllowedUserAddress = () => {
    const location = useLocation();

    const checkIsAddressAllowed = async (
        contract: ethers.Contract | null,
        address: string
    ) => {
        if (address === '') {
            return false;
        }
        try {
            switch (location.pathname) {
                case '/dealer':
                    return await contract?.isDealer(address);
                case '/traffic':
                    return await contract?.isTrafficPolice(address);
                case '/insurance':
                    return await contract?.isInsuranceCompany(address);
                case '/admin':
                    return (
                        (await contract?.isDealer(address)) &&
                        (await contract?.isTrafficPolice(address)) &&
                        (await contract?.isInsuranceCompany(address))
                    );
                default:
                    return false;
            }
        } catch (error) {
            console.error('Error:', error);
            return false;
        }
    };

    return checkIsAddressAllowed;
};

export default useAllowedUserAddress;
