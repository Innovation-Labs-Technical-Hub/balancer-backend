import { Chain } from '@prisma/client';
import { prisma } from '../../../prisma/prisma-client';
import { getPoolMetadataTags as getPoolMetadataTags } from '../../sources/github/pool-metadata-tags';
import { syncIncentivizedCategory } from '../pool/sync-incentivized-category';
import { getErc4626Tags } from '../../sources/github/pool-erc4626-tags';
import { getPoolHookTags } from '../../sources/github/pool-hook-tags';
import _ from 'lodash';

export const syncTags = async (): Promise<void> => {
    // Get metadata as tags
    let allTags = await getPoolMetadataTags({});
    allTags = await getErc4626Tags(allTags);
    allTags = await getPoolHookTags(allTags);

    // Convert the transformed object to an array of PoolTags
    const tagsData = Object.entries(allTags).map(([id, tags]) => ({
        id,
        tags,
    }));

    // Check if the pool exists in the DB
    const existingPools = await prisma.prismaPool.findMany({
        select: {
            chain: true,
            id: true,
        },
    });

    const existingPoolIds = existingPools.map(({ id }) => id);

    const idToChain = existingPools.reduce((acc, { id, chain }) => {
        acc[id] = chain;
        return acc;
    }, {} as Record<string, Chain>);

    // Skip items that are missing in the DB
    const filteredMetadata = tagsData.filter(({ id }) => existingPoolIds.includes(id));

    const data = filteredMetadata.map(({ id, tags }) => ({
        where: {
            id_chain: {
                id,
                chain: idToChain[id],
            },
        },
        data: {
            categories: [...tags]
                .map((tag) => tag.toUpperCase())
                .map((tag) => (tag === 'BLACKLISTED' ? 'BLACK_LISTED' : tag)),
        },
    }));

    // Insert new categories
    await prisma.$transaction([
        // Update existing categories
        ...data.map(({ where, data }) => prisma.prismaPool.update({ where, data })),
        // Remove categories from pools that are not in the metadata
        prisma.prismaPool.updateMany({
            where: {
                NOT: {
                    id: {
                        in: filteredMetadata.map(({ id }) => id),
                    },
                },
            },
            data: {
                categories: [],
            },
        }),
    ]);

    // Sync incentivized category
    await syncIncentivizedCategory();
};
