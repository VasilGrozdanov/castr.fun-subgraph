import {
    PoolCreated as PoolCreatedEvent,
    LiquidityLocked as LiquidityLockedEvent,
    PoolMigrated as PoolMigratedEvent,
} from "../generated/templates/UniswapV3Migrator/UniswapV3Migrator"
import {
    Pool,
    MigratorCreatedPool, LiquidityLock, MigratedPool
} from "../generated/schema"
import { UniswapV3Pool } from "../generated/templates"
import { BigInt } from "@graphprotocol/graph-ts";
import { WETH } from "./constants";


export function handlePoolCreated(event: PoolCreatedEvent): void {
    UniswapV3Pool.create(event.params.pool)

    let pool = new Pool(event.params.pool)
    const isWeth = event.params.token0.equals(WETH)
    pool.tokenAddress = isWeth ? event.params.token1 : event.params.token0
    pool.tick = event.params.tick
    pool.tickCumulativeStart = BigInt.zero()
    pool.startTickTimestamp = event.params.timestamp
    pool.tickCumulativeEnd = BigInt.zero()
    pool.endTickTimestamp = event.params.timestamp
    pool.twat = isWeth ? BigInt.fromI32(event.params.tick) : BigInt.fromI32(-event.params.tick)
    pool.sqrtPriceX96 = event.params.sqrtPriceX96
    pool.blockTimestamp = event.block.timestamp
    pool.creationTimestamp = event.block.timestamp
    pool.isRewarded = false

    let migratorCreatedPool = new MigratorCreatedPool(event.params.pool)
    migratorCreatedPool.token0 = event.params.token0
    migratorCreatedPool.token1 = event.params.token1
    migratorCreatedPool.timestamp = event.params.timestamp
    migratorCreatedPool.sqrtPriceX96 = event.params.sqrtPriceX96

    pool.save()
    migratorCreatedPool.save()
}
export function handleLiquidityLocked(event: LiquidityLockedEvent): void {
    let lock = new LiquidityLock(event.params.lockId.toString())
    lock.tokenId = event.params.tokenId
    lock.timestamp = event.params.timestamp

    lock.save()
}
export function handlePoolMigrated(event: PoolMigratedEvent): void {
    let poolMigrated = new MigratedPool(event.params.pool)
    poolMigrated.tokenId = event.params.tokenId
    poolMigrated.lockId = event.params.lockId
    poolMigrated.amount0 = event.params.amount0
    poolMigrated.amount1 = event.params.amount1
    poolMigrated.liquidity = event.params.liquidity
    poolMigrated.timestamp = event.params.timestamp

    poolMigrated.save()
}

