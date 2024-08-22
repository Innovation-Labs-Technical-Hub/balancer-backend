import { GqlChain, Resolvers } from '../../schema';
import { userService } from './user.service';
import { getRequiredAccountAddress, isAdminRoute } from '../auth/auth-context';
import { tokenService } from '../token/token.service';
import { headerChain } from '../context/header-chain';
import { initRequestScopedContext, setRequestScopedContextValue } from '../context/request-scoped-context';
import { chainToIdMap } from '../network/network-config';

const resolvers: Resolvers = {
    Query: {
        userGetPoolBalances: async (parent, { chains, address }, context) => {
            const currentChain = headerChain();
            if (!chains && currentChain) {
                chains = [currentChain];
            } else if (!chains) {
                throw new Error('userGetPoolBalances error: Provide "chains" param');
            }
            const accountAddress = address || getRequiredAccountAddress(context);
            const tokenPrices = await tokenService.getTokenPricesForChains(chains);
            const balances = await userService.getUserPoolBalances(accountAddress, chains);

            return balances.map((balance) => ({
                ...balance,
                tokenPrice: tokenService.getPriceForToken(
                    tokenPrices[balance.chain] || [],
                    balance.tokenAddress,
                    balance.chain,
                ),
            }));
        },
        // TODO: Deprecate in favor of poolGetEvents
        userGetPoolJoinExits: async (parent, { first, skip, poolId, chain, address }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('userGetPoolJoinExits error: Provide "chain" param');
            }
            const accountAddress = address || getRequiredAccountAddress(context);

            return userService.getUserPoolInvestments(accountAddress, poolId, chain, first, skip);
        },
        // TODO: Deprecate in favor of poolGetEvents
        userGetSwaps: async (parent, { first, skip, poolId, chain, address }, context) => {
            const currentChain = headerChain();
            if (!chain && currentChain) {
                chain = currentChain;
            } else if (!chain) {
                throw new Error('userGetSwaps error: Provide "chain" param');
            }
            const accountAddress = address || getRequiredAccountAddress(context);
            return userService.getUserSwaps(accountAddress, poolId, chain, first, skip);
        },
        userGetStaking: async (parent, { chains, address }, context) => {
            const currentChain = headerChain();
            if (!chains && currentChain) {
                chains = [currentChain];
            } else if (!chains) {
                throw new Error('userGetStaking error: Provide "chains" param');
            }
            const accountAddress = address || getRequiredAccountAddress(context);

            return userService.getUserStaking(accountAddress, chains);
        },
    },
    Mutation: {
        userSyncChangedWalletBalancesForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            await userService.syncChangedWalletBalancesForAllPools();

            return 'success';
        },
        userInitWalletBalancesForAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            await userService.initWalletBalancesForAllPools();

            return 'success';
        },
        userInitWalletBalancesForPool: async (parent, { poolId }, context) => {
            isAdminRoute(context);

            await userService.initWalletBalancesForPool(poolId);

            return 'success';
        },
        userInitStakedBalances: async (parent, { stakingTypes, chains }, context) => {
            isAdminRoute(context);

            const result: { chain: GqlChain; success: boolean; error: string | undefined }[] = [];

            for (const chain of chains) {
                initRequestScopedContext();
                setRequestScopedContextValue('chainId', chainToIdMap[chain]);
                try {
                    await userService.initStakedBalances(stakingTypes);
                    result.push({ chain, success: true, error: undefined });
                } catch (e) {
                    result.push({ chain, success: false, error: `${e}` });
                    console.log(`Could not reload staked balances for users for chain ${chain}: ${e}`);
                }
            }

            return result;
        },
        userSyncChangedStakedBalances: async (parent, {}, context) => {
            isAdminRoute(context);

            await userService.syncChangedStakedBalances();

            return 'success';
        },
        userSyncBalance: async (parent, { poolId }, context) => {
            const accountAddress = getRequiredAccountAddress(context);

            await userService.syncUserBalance(accountAddress, poolId);

            return 'success';
        },
        userSyncBalanceAllPools: async (parent, {}, context) => {
            isAdminRoute(context);

            const accountAddress = getRequiredAccountAddress(context);

            await userService.syncUserBalanceAllPools(accountAddress);

            return 'success';
        },
    },
};

export default resolvers;
