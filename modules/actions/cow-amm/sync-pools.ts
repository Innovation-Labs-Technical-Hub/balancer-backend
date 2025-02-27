import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { fetchCowAmmData } from '../../sources/contracts';
import { enrichPoolUpsertsUsd } from '../../sources/enrichers/pool-upserts-usd';
import type { ViemClient } from '../../sources/types';
import { applyOnchainDataUpdateCowAmm } from '../../sources/enrichers/apply-onchain-data';

/**
 * Gets a list of pool ids and fetches the onchain data then upserts into the database.
 *
 * @param ids List of pool ids to fetch and upsert
 * @param viemClient
 * @param chain
 * @param blockNumber
 */
export const syncPools = async (ids: string[], viemClient: ViemClient, chain: Chain, blockNumber: bigint) => {
    // Get onchain data for the pools
    const onchainData = await fetchCowAmmData(ids, viemClient, blockNumber);

    // Needed to get the token decimals for the USD calculations,
    // Keeping it external, because we fetch these tokens in the upsert pools function
    const allTokens = await prisma.prismaToken.findMany({
        where: {
            chain: chain,
        },
    });

    // Get the prices
    const prices = await prisma.prismaTokenCurrentPrice
        .findMany({
            where: {
                chain: chain,
            },
        })
        .then((prices) => Object.fromEntries(prices.map((price) => [price.tokenAddress, price.price])));

    // Get the data for the tables about pools
    const dbPools = ids.map((id) =>
        applyOnchainDataUpdateCowAmm({}, onchainData[id], allTokens, chain, id, blockNumber),
    );

    const poolsWithUSD = dbPools.map((upsert) =>
        enrichPoolUpsertsUsd(
            {
                poolDynamicData: upsert.poolDynamicData,
                poolToken: upsert.poolToken,
            },
            prices,
        ),
    );

    // Upsert RPC data to the database
    // Update pools data to the database
    for (const { poolDynamicData, poolToken } of poolsWithUSD) {
        try {
            await prisma.$transaction([
                prisma.prismaPoolDynamicData.update({
                    where: {
                        poolId_chain: {
                            poolId: poolDynamicData.id,
                            chain: chain,
                        },
                    },
                    data: poolDynamicData,
                }),
                ...poolToken.map((token) =>
                    prisma.prismaPoolToken.update({
                        where: {
                            id_chain: {
                                id: token.id,
                                chain: token.chain,
                            },
                        },
                        data: token,
                    }),
                ),
            ]);
        } catch (e) {
            console.error('Error upserting pool', e);
        }
    }
    return true;
};
