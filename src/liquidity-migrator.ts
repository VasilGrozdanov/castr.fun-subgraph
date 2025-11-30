import {
    PoolCreated as PoolCreatedEvent,
    LiquidityLocked as LiquidityLockedEvent,
    PoolMigrated as PoolMigratedEvent,
} from "../generated/templates/LiquidityMigrator/ILiquidityMigrator"
import {
    Pool,
    MigratorCreatedPool, LiquidityLock, MigratedPool
} from "../generated/schema"
import { CLPool } from "../generated/templates"
import { BigInt } from "@graphprotocol/graph-ts";
import { WETH } from "./constants";


export function handlePoolCreated(event: PoolCreatedEvent): void {
    CLPool.create(event.params.pool)

    const pool = new Pool(event.params.pool)
    const isToken1 = event.params.token0.equals(WETH)
    pool.tokenAddress = isToken1 ? event.params.token1 : event.params.token0
    pool.tick = event.params.tick
    pool.tickCumulativeStart = BigInt.zero()
    pool.startTickTimestamp = event.params.timestamp
    pool.tickCumulativeEnd = BigInt.zero()
    pool.endTickTimestamp = event.params.timestamp
    pool.twat = BigInt.fromI32(event.params.tick)
    let sqrtPriceX96 = event.params.sqrtPriceX96
    if (!isToken1) {
        // reverse if token1 is WETH. sqrtPriceX96 = sqrt(Price_token1/token0)*2^96, Price_token1/token0 = 1 / Price_token0/token1 =>
        // sqrtPriceX96Reverse = 2^192 / ( sqrt(Price_token1/token0) * 2^96 ) = 2^192 / sqrtPriceX96 
        sqrtPriceX96 = BigInt.fromI32(2).pow(192).div(sqrtPriceX96)
    }
    pool.sqrtPriceX96 = sqrtPriceX96
    pool.blockTimestamp = event.block.timestamp
    pool.creationTimestamp = event.block.timestamp
    pool.isRewarded = false
    const twatString = pool.twat.abs().toString().padStart(6, "0");
    const sqrtPriceX96String = pool.sqrtPriceX96.toString().padStart(49, "0");
    const tickString = Math.abs(pool.tick).toString().padStart(6, "0");
    pool.score = `${twatString}_${sqrtPriceX96String}_${tickString}`;

    let migratorCreatedPool = new MigratorCreatedPool(event.params.pool)
    migratorCreatedPool.token0 = event.params.token0
    migratorCreatedPool.token1 = event.params.token1
    migratorCreatedPool.timestamp = event.params.timestamp
    migratorCreatedPool.sqrtPriceX96 = event.params.sqrtPriceX96

    pool.save()
    migratorCreatedPool.save()
}
export function handleLiquidityLocked(event: LiquidityLockedEvent): void {
    const lock = new LiquidityLock(event.params.tokenId.toString())
    lock.locker = event.params.locker
    lock.timestamp = event.params.timestamp

    lock.save()
}
export function handlePoolMigrated(event: PoolMigratedEvent): void {
    const poolMigrated = new MigratedPool(event.params.pool)
    poolMigrated.tokenId = event.params.tokenId
    poolMigrated.tokenAddress = event.params.token
    poolMigrated.locker = event.params.locker
    poolMigrated.amount0 = event.params.amount0
    poolMigrated.amount1 = event.params.amount1
    poolMigrated.liquidity = event.params.liquidity
    poolMigrated.timestamp = event.params.timestamp

    poolMigrated.save()
}

