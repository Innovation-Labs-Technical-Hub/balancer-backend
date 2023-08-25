import { BigNumber, ethers } from 'ethers';
import { DeploymentEnv, NetworkConfig, NetworkData } from './network-config-types';
import { SpookySwapAprService } from '../pool/lib/apr-data-sources/fantom/spooky-swap-apr.service';
import { tokenService } from '../token/token.service';
import { YearnVaultAprService } from '../pool/lib/apr-data-sources/fantom/yearn-vault-apr.service';
import { StaderStakedFtmAprService } from '../pool/lib/apr-data-sources/fantom/stader-staked-ftm-apr.service';
import { ReaperCryptAprService } from '../pool/lib/apr-data-sources/reaper-crypt-apr.service';
import { PhantomStableAprService } from '../pool/lib/apr-data-sources/phantom-stable-apr.service';
import { BoostedPoolAprService } from '../pool/lib/apr-data-sources/boosted-pool-apr.service';
import { SwapFeeAprService } from '../pool/lib/apr-data-sources/swap-fee-apr.service';
import { MasterchefFarmAprService } from '../pool/lib/apr-data-sources/fantom/masterchef-farm-apr.service';
import { ReliquaryFarmAprService } from '../pool/lib/apr-data-sources/fantom/reliquary-farm-apr.service';
import { MasterChefStakingService } from '../pool/lib/staking/master-chef-staking.service';
import { masterchefService } from '../subgraphs/masterchef-subgraph/masterchef.service';
import { ReliquaryStakingService } from '../pool/lib/staking/reliquary-staking.service';
import { reliquarySubgraphService } from '../subgraphs/reliquary-subgraph/reliquary.service';
import { BeetsPriceHandlerService } from '../token/lib/token-price-handlers/beets-price-handler.service';
import { FbeetsPriceHandlerService } from '../token/lib/token-price-handlers/fbeets-price-handler.service';
import { ClqdrPriceHandlerService } from '../token/lib/token-price-handlers/clqdr-price-handler.service';
import { BptPriceHandlerService } from '../token/lib/token-price-handlers/bpt-price-handler.service';
import { LinearWrappedTokenPriceHandlerService } from '../token/lib/token-price-handlers/linear-wrapped-token-price-handler.service';
import { SwapsPriceHandlerService } from '../token/lib/token-price-handlers/swaps-price-handler.service';
import { UserSyncMasterchefFarmBalanceService } from '../user/lib/user-sync-masterchef-farm-balance.service';
import { UserSyncReliquaryFarmBalanceService } from '../user/lib/user-sync-reliquary-farm-balance.service';
import { every } from '../../worker/intervals';
import { SanityContentService } from '../content/sanity-content.service';
import { AnkrStakedFtmAprService } from '../pool/lib/apr-data-sources/fantom/ankr-staked-ftm-apr.service';
import { CoingeckoPriceHandlerService } from '../token/lib/token-price-handlers/coingecko-price-handler.service';
import { coingeckoService } from '../coingecko/coingecko.service';
import { AnkrStakedEthAprService } from '../pool/lib/apr-data-sources/fantom/ankr-staked-eth-apr.service';
import { env } from '../../app/env';

const fantomNetworkData: NetworkData = {
    chain: {
        slug: 'fantom',
        id: 250,
        nativeAssetAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        wrappedNativeAssetAddress: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
        prismaId: 'FANTOM',
        gqlId: 'FANTOM',
    },
    subgraphs: {
        startDate: '2021-10-08',
        balancer: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/beethovenx',
        beetsBar: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/beets-bar',
        blocks: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/fantom-blocks',
        masterchef: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/masterchefv2',
        reliquary: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/reliquary',
        userBalances: 'https://api.thegraph.com/subgraphs/name/beethovenxfi/user-bpt-balances-fantom',
    },
    eth: {
        address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        addressFormatted: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        symbol: 'FTM',
        name: 'Fantom',
    },
    weth: {
        address: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
        addressFormatted: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
    },
    coingecko: {
        nativeAssetId: 'fantom',
        platformId: 'fantom',
        excludedTokenAddresses: [
            '0x04068da6c83afcfa0e13ba15a6696662335d5b75', // multi usdc
            '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e', // multi usdt
            '0x049d68029688eabf473097a2fc38ef61633a3c7a', // multi dai
            '0x321162cd933e2be498cd2267a90534a804051b11', // multi wbtc
            '0x74b23882a30290451a17c44f4f05243b6b58c76d', // mutli weth
            '0xcfc785741dc0e98ad4c9f6394bb9d43cd1ef5179', // ankrftm
            '0xd67de0e0a0fd7b15dc8348bb9be742f3c5850454', // multi BNB
            '0x1e4f97b9f9f913c46f1632781732927b9019c68b', // multi CRV
            '0x511d35c52a3c244e7b8bd92c0c297755fbd89212', // multi AVAX
            '0x40df1ae6074c35047bff66675488aa2f9f6384f3', // multi matic
            '0x9fb9a33956351cf4fa040f65a13b835a3c8764e3', // multi multi
            '0xddcb3ffd12750b45d32e084887fdf1aabab34239', // multi any
            '0xb3654dc3d10ea7645f8319668e8f54d2574fbdc8', // multi link
            '0x468003b688943977e6130f4f68f23aad939a1040', // multi spell
            '0x10010078a54396f62c96df8532dc2b4847d47ed3', // multi hnd
            '0x6a07a792ab2965c72a5b8088d3a069a7ac3a993b', // multi aave
            '0x95dd59343a893637be1c3228060ee6afbf6f0730', // multi luna
            '0xae75a438b2e0cb8bb01ec1e1e376de11d44477cc', // multi sushi
            '0xddc0385169797937066bbd8ef409b5b3c0dfeb52', // multi wmemo
            '0xb67fa6defce4042070eb1ae1511dcd6dcc6a532e', // multi alusd
            '0xfb98b335551a418cd0737375a2ea0ded62ea213b', // multi mai
            '0x68aa691a8819b07988b18923f712f3f4c8d36346', // multi qi
            '0x29b0da86e484e1c0029b56e817912d778ac0ec69', // multi yfi
            '0xd6070ae98b8069de6b494332d1a1a81b6179d960', // multi bifi
            '0xe2d27f06f63d98b8e11b38b5b08a75d0c8dd62b9', // multi ust
            '0x9879abdea01a879644185341f7af7d8343556b7a', // multi tusd
            '0x3129662808bec728a27ab6a6b9afd3cbaca8a43c', // multi dola
            '0x0615dbba33fe61a31c7ed131bda6655ed76748b1', // multi ankr
        ],
    },
    tokenPrices: {
        maxHourlyPriceHistoryNumDays: 100,
    },
    rpcUrl: 'https://rpc.fantom.network',
    rpcMaxBlockRange: 1000,
    sanity: {
        projectId: '1g2ag2hb',
        dataset: 'production',
    },
    protocolToken: 'beets',
    beets: {
        address: '0xf24bcf4d1e507740041c9cfd2dddb29585adce1e',
        beetsPriceProviderRpcUrl: 'https://rpc.ftm.tools',
    },
    fbeets: {
        address: '0xfcef8a994209d6916eb2c86cdd2afd60aa6f54b1',
        farmId: '22',
        poolId: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019',
        poolAddress: '0xcde5a11a4acb4ee4c805352cec57e236bdbc3837',
    },
    balancer: {
        vault: '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce',
        composableStablePoolFactories: [
            '0x5AdAF6509BCEc3219455348AC45d6D3261b1A990',
            '0xB384A86F2Fd7788720db42f9daa60fc07EcBeA06',
            '0x44814E3A603bb7F1198617995c5696C232F6e8Ed',
            '0x911566c808bF00acB200B418564440A2Af177548',
            '0x5c3094982cF3c97A06b7d62A6f7669F14a199B19',
            '0x23F03a4fb344d8B98833d2ACe093cc305E03474f',
        ],
        weightedPoolV2Factories: [
            '0xB2ED595Afc445b47Db7043bEC25e772bf0FA1fbb',
            '0x8ea1c497c16726E097f62C8C9FBD944143F27090',
            '0xea87F3dFfc679035653C0FBa70e7bfe46E3FB733',
            '0xd678b6Acd834Cc969Bb19Ce82727f2a541fb7941',
            '0xb841Df73861E65E6D61a80F503F095a91ce75e15',
        ],
        swapProtocolFeePercentage: 0.25,
        yieldProtocolFeePercentage: 0.25,
        poolDataQueryContract: '0x9642Dbba0753B1518022d7617Be079f0d7EFD165',
        factoriesWithpoolSpecificProtocolFeePercentagesProvider: [
            '0xb841df73861e65e6d61a80f503f095a91ce75e15',
            '0x5c3094982cf3c97a06b7d62a6f7669f14a199b19',
        ],
    },
    multicall: '0x66335d7ad8011f6aa3f48aadcb523b62b38ed961',
    multicall3: '0xca11bde05977b3631167028862be2a173976ca11',
    masterchef: {
        address: '0x8166994d9ebBe5829EC86Bd81258149B87faCfd3',
        excludedFarmIds: [
            '34', //OHM bonding farm
            '28', //OHM bonding farm
            '9', //old fidellio dueto (non fbeets)
            '98', //reliquary beets streaming farm
        ],
    },
    reliquary: {
        address: '0x1ed6411670c709F4e163854654BD52c74E66D7eC',
        excludedFarmIds: [
            '0', // test with dummy token
            '1', // test with fresh beets pool BPT
        ],
    },
    avgBlockSpeed: 1,
    sor: {
        main: {
            url: 'https://2bz6hsr2y54svqgow7tbwwsrta0icouy.lambda-url.ca-central-1.on.aws/',
            maxPools: 8,
            forceRefresh: false,
            gasPrice: BigNumber.from(10),
            swapGas: BigNumber.from('1000000'),
        },
        canary: {
            url: 'https://mep53ds2noe6rhicd67q7raqhq0dkupc.lambda-url.eu-central-1.on.aws/',
            maxPools: 8,
            forceRefresh: false,
            gasPrice: BigNumber.from(10),
            swapGas: BigNumber.from('1000000'),
        },
    },
    yearn: {
        vaultsEndpoint: 'https://d28fcsszptni1s.cloudfront.net/v1/chains/250/vaults/all',
    },
    copper: {
        proxyAddress: '0xbC8a71C75ffbd2807c021F4F81a8832392dEF93c',
    },
    reaper: {
        linearPoolFactories: ['0xd448c4156b8de31e56fdfc071c8d96459bb28119'],
        linearPoolIdsFromErc4626Factory: [
            '0x55e0499d268858a5e804d7864dc2a6b4ef194c630000000000000000000005b1',
            '0xa9a1f2f7407ce27bcef35d04c47e079e7d6d399e0000000000000000000005b6',
            '0xa8bcdca345e61bad9bb539933a4009f7a6f4b7ea0000000000000000000006eb',
            '0x654def39262548cc958d07c82622e23c52411c820000000000000000000006ec',
            '0xd3f155d7f421414dc4177e54e4308274dfa8b9680000000000000000000006ed',
            '0xb8b0e5e9f8b740b557e7c26fcbc753523a718a870000000000000000000006ee',
            '0xdc910e2647caae5f63a760b70a2308e1c90d88860000000000000000000006ef',
            '0x92502cd8e00f5b8e737b2ba203fdd7cd27b23c8f000000000000000000000718',
            '0xc385e76e575b2d71eb877c27dcc1608f77fada99000000000000000000000719',
            '0x685056d3a4e574b163d0fa05a78f1b0b3aa04a8000000000000000000000071a',
            '0x3c1420df122ac809b9d1ba77906f833764d6450100000000000000000000071b',
            '0xa0051ab2c3eb7f17758428b02a07cf72eb0ef1a300000000000000000000071c',
            '0x442988091cdc18acb8912cd3fe062cda9233f9dc00000000000000000000071d',
        ],
        averageAPRAcrossLastNHarvests: 5,
        multistratAprSubgraphUrl: 'https://api.thegraph.com/subgraphs/name/byte-masons/multi-strategy-vaults-fantom',
    },
    spooky: {
        xBooContract: '0x841fad6eae12c286d1fd18d1d525dffa75c7effe',
    },
    stader: {
        sFtmxContract: '0xd7028092c830b5c8fce061af2e593413ebbc1fc1',
    },
    ankr: {
        ankrFtmContract: '0xcfc785741dc0e98ad4c9f6394bb9d43cd1ef5179',
        ankrEthContract: '0x12d8ce035c5de3ce39b1fdd4c1d5a745eaba3b8c',
    },
    datastudio: {
        main: {
            user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
            sheetId: '1Ifbfh8njyssWKuLlUvlfXt-r3rnd4gAIP5sSM-lEuBU',
            databaseTabName: 'Database v2',
            compositionTabName: 'Pool Composition v2',
            emissionDataTabName: 'EmissionData',
        },
        canary: {
            user: 'datafeed-service@datastudio-366113.iam.gserviceaccount.com',
            sheetId: '17bYDbQAdMwGevfJ7thiwI8mjYeZppVRi8gD8ER6CtSs',
            databaseTabName: 'Database v2',
            compositionTabName: 'Pool Composition v2',
            emissionDataTabName: 'EmissionData',
        },
    },
    monitoring: {
        main: {
            alarmTopicArn: 'arn:aws:sns:ca-central-1:118697801881:api_alarms',
        },
        canary: {
            alarmTopicArn: 'arn:aws:sns:eu-central-1:118697801881:api_alarms',
        },
    },
};

export const fantomNetworkConfig: NetworkConfig = {
    data: fantomNetworkData,
    contentService: new SanityContentService(),
    provider: new ethers.providers.JsonRpcProvider({ url: fantomNetworkData.rpcUrl, timeout: 60000 }),
    poolAprServices: [
        // new SpookySwapAprService(tokenService, fantomNetworkData.spooky!.xBooContract),
        new YearnVaultAprService(tokenService, fantomNetworkData.yearn!.vaultsEndpoint),
        new StaderStakedFtmAprService(tokenService, fantomNetworkData.stader!.sFtmxContract),
        new AnkrStakedFtmAprService(tokenService, fantomNetworkData.ankr!.ankrFtmContract),
        new AnkrStakedEthAprService(tokenService, fantomNetworkData.ankr!.ankrEthContract),
        new ReaperCryptAprService(
            fantomNetworkData.reaper!.multistratAprSubgraphUrl,
            fantomNetworkData.reaper!.linearPoolFactories,
            fantomNetworkData.reaper!.linearPoolIdsFromErc4626Factory,
            fantomNetworkData.reaper!.averageAPRAcrossLastNHarvests,
            fantomNetworkData.stader ? fantomNetworkData.stader.sFtmxContract : undefined,
            fantomNetworkData.lido ? fantomNetworkData.lido.wstEthContract : undefined,
        ),
        new PhantomStableAprService(),
        new BoostedPoolAprService(),
        new SwapFeeAprService(fantomNetworkData.balancer.swapProtocolFeePercentage),
        new MasterchefFarmAprService(fantomNetworkData.beets!.address),
        new ReliquaryFarmAprService(fantomNetworkData.beets!.address),
    ],
    poolStakingServices: [
        new MasterChefStakingService(masterchefService, fantomNetworkData.masterchef!.excludedFarmIds),
        new ReliquaryStakingService(fantomNetworkData.reliquary!.address, reliquarySubgraphService),
    ],
    tokenPriceHandlers: [
        new BeetsPriceHandlerService(
            fantomNetworkData.beets!.address,
            fantomNetworkData.beets!.beetsPriceProviderRpcUrl,
        ),
        new FbeetsPriceHandlerService(fantomNetworkData.fbeets!.address, fantomNetworkData.fbeets!.poolId),
        new ClqdrPriceHandlerService(),
        new CoingeckoPriceHandlerService(coingeckoService),
        new BptPriceHandlerService(),
        new LinearWrappedTokenPriceHandlerService(),
        new SwapsPriceHandlerService(),
    ],
    userStakedBalanceServices: [
        new UserSyncMasterchefFarmBalanceService(
            fantomNetworkData.fbeets!.address,
            fantomNetworkData.fbeets!.farmId,
            fantomNetworkData.masterchef!.address,
            fantomNetworkData.masterchef!.excludedFarmIds,
        ),
        new UserSyncReliquaryFarmBalanceService(fantomNetworkData.reliquary!.address),
    ],
    /*
    For sub-minute jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3. 
    This is needed because the minimum alarm period is 1 minute and we want the alarm to trigger already after 1 minute instead of 3.

    For every 1 days jobs we set the alarmEvaluationPeriod and alarmDatapointsToAlarm to 1 instead of the default 3. 
    This is needed because the maximum alarm evaluation period is 1 day (period * evaluationPeriod).
    */
    workerJobs: [
        {
            name: 'update-token-prices',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(4, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'update-liquidity-for-inactive-pools',
            interval: every(1, 'days'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'update-liquidity-for-active-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(4, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'update-pool-apr',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(4, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'load-on-chain-data-for-pools-with-active-updates',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(2, 'minutes') : every(1, 'minutes'),
        },
        {
            name: 'sync-new-pools-from-subgraph',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(4, 'minutes') : every(2, 'minutes'),
        },
        {
            name: 'sync-sanity-pool-data',
            interval: every(3, 'minutes'),
        },
        {
            name: 'sync-tokens-from-pool-tokens',
            interval: every(5, 'minutes'),
        },
        {
            name: 'update-liquidity-24h-ago-for-all-pools',
            interval: every(5, 'minutes'),
        },
        {
            name: 'sync-fbeets-ratio',
            interval: every(12, 'hours'),
        },
        {
            name: 'cache-average-block-time',
            interval: every(1, 'hours'),
        },
        {
            name: 'sync-staking-for-pools',
            interval: every(5, 'minutes'),
        },
        {
            name: 'cache-protocol-data',
            interval: every(1, 'minutes'),
        },
        {
            name: 'sync-latest-snapshots-for-all-pools',
            interval: every(1, 'hours'),
        },
        {
            name: 'update-lifetime-values-for-all-pools',
            interval: every(30, 'minutes'),
        },
        {
            name: 'sync-changed-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(40, 'seconds') : every(20, 'seconds'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'user-sync-wallet-balances-for-all-pools',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(30, 'seconds') : every(15, 'seconds'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'user-sync-staked-balances',
            interval: (env.DEPLOYMENT_ENV as DeploymentEnv) === 'canary' ? every(30, 'seconds') : every(15, 'seconds'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'sync-user-snapshots',
            interval: every(1, 'hours'),
        },
        {
            name: 'sync-latest-reliquary-snapshots',
            interval: every(1, 'hours'),
        },
        {
            name: 'sync-latest-relic-snapshots',
            interval: every(1, 'hours'),
        },
        {
            name: 'purge-old-tokenprices',
            interval: every(1, 'days'),
            alarmEvaluationPeriod: 1,
            alarmDatapointsToAlarm: 1,
        },
        {
            name: 'sync-coingecko-coinids',
            interval: every(2, 'hours'),
        },
        {
            name: 'update-fee-volume-yield-all-pools',
            interval: every(1, 'hours'),
        },
        {
            name: 'feed-data-to-datastudio',
            interval: every(1, 'minutes'),
        },
    ],
};
