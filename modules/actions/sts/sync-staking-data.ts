import { prisma } from '../../../prisma/prisma-client';
import { fetchSonicStakingData } from '../../sources/contracts/fetch-sts-staking-data';
import { StsSubgraphService } from '../../sources/subgraphs/sts-subgraph/sts.service';
import { Address, formatEther } from 'viem';
import { ViemClient } from '../../sources/viem-client';

interface ApiResponse {
    success: boolean;
    data: {
        apr: number;
    };
}

export async function syncStakingData(
    stakingContractAddress: Address,
    viemClient: ViemClient,
    subgraphService: StsSubgraphService,
    baseAprUrl: string,
    validatorFee: number,
) {
    const stakingDataOnchain = await fetchSonicStakingData(stakingContractAddress, viemClient);
    const validators = await subgraphService.getAllValidators();

    const response = await fetch(baseAprUrl);
    const data = (await response.json()) as ApiResponse;
    if (!data.success) {
        throw new Error('Failed to fetch sonic staking APR');
    }

    const stakingApr =
        (parseFloat(stakingDataOnchain.totalDelegated) / parseFloat(stakingDataOnchain.totalAssets)) *
        ((data.data.apr / 100) * (1 - validatorFee)) *
        (1 - parseFloat(stakingDataOnchain.protocolFee));

    await prisma.prismaStakedSonicData.upsert({
        where: { id: stakingContractAddress },
        create: {
            id: stakingContractAddress,
            totalAssets: stakingDataOnchain.totalAssets,
            totalAssetsDelegated: stakingDataOnchain.totalDelegated,
            totalAssetsPool: stakingDataOnchain.totalPool,
            exchangeRate: stakingDataOnchain.exchangeRate,
            stakingApr: `${stakingApr}`,
        },
        update: {
            id: stakingContractAddress,
            totalAssets: stakingDataOnchain.totalAssets,
            totalAssetsDelegated: stakingDataOnchain.totalDelegated,
            totalAssetsPool: stakingDataOnchain.totalPool,
            exchangeRate: stakingDataOnchain.exchangeRate,
            stakingApr: `${stakingApr}`,
        },
    });

    for (const validator of validators) {
        await prisma.prismaStakedSonicDelegatedValidator.upsert({
            where: { validatorId: validator.id },
            create: {
                validatorId: validator.id,
                assetsDelegated: validator.amountAssetsDelegated,
                sonicStakingId: stakingContractAddress,
            },
            update: {
                validatorId: validator.id,
                assetsDelegated: validator.amountAssetsDelegated,
            },
        });
    }
}
