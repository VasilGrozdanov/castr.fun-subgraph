import {
    PoolCreated as PoolCreatedEvent,
    LiquidityLocked as LiquidityLockedEvent,
    PoolMigrated as PoolMigratedEvent,
} from "../generated/templates/LiquidityMigrator/ILiquidityMigrator"
import { Pool } from "../generated/schema"
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
    const creationTimestampString = pool.creationTimestamp.toString();
    pool.score = `${twatString}_${sqrtPriceX96String}_${tickString}_${creationTimestampString}`;

    pool.save()
}

