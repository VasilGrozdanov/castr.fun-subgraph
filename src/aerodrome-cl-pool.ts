import {
  Burn as BurnEvent,
  Mint as MintEvent,
  Swap as SwapEvent
} from "../generated/templates/CLPool/ICLPool"
import {
  Pool,
  Counter,
  LatestReward
} from "../generated/schema"
import { BigInt, Bytes, ByteArray } from "@graphprotocol/graph-ts";
import { ONE, WETH, GLOBAL } from "./constants";

/**
 * Handles a burn event in the Aerodrome CL pool.
 *
 * This function processes a burn event by updating the pool's tick cumulative
 * values and timestamps. It loads the pool and the latest reward data from
 * the storage, and if either is not found, it exits early. If the pool's
 * start tick timestamp is earlier than the latest reward's block timestamp,
 * the function calculates the time difference, updates the pool's start tick
 * timestamp, and adjusts the tick cumulative start value.
 *
 * The function also calculates the time difference between the event's block
 * timestamp and the pool's end tick timestamp, updating the pool's end tick
 * timestamp and tick cumulative end value accordingly. Finally, it updates
 * the pool's block timestamp and saves the historical pool data.
 *
 * @param event - The burn event containing the address of the pool and other relevant data.
 */

export function handleBurn(event: BurnEvent): void {
  const pool = Pool.load(event.address)
  const latestReward = LatestReward.load(ONE)
  if (pool == null || latestReward == null) {
    return;
  }

  let timeDiff = BigInt.zero()
  if (pool.startTickTimestamp.lt(latestReward.blockTimestamp)) {
    timeDiff = latestReward.blockTimestamp.minus(pool.startTickTimestamp)
    pool.startTickTimestamp = latestReward.blockTimestamp
    pool.tickCumulativeStart = pool.tickCumulativeStart.plus(timeDiff.times(BigInt.fromI32(pool.tick)))
  }

  timeDiff = event.block.timestamp.minus(pool.endTickTimestamp)
  pool.endTickTimestamp = event.block.timestamp
  const tick = BigInt.fromI32(pool.tick)
  pool.tickCumulativeEnd = pool.tickCumulativeEnd.plus(timeDiff.times(tick))
  pool.blockTimestamp = event.block.timestamp

  pool.save()
}

/**
 * This function processes a mint event by updating the pool's tick cumulative
 * values and timestamps. It loads the pool and the latest reward data from
 * the storage, and if either is not found, it exits early. If the pool's
 * start tick timestamp is earlier than the latest reward's block timestamp,
 * the function calculates the time difference, updates the pool's start tick
 * timestamp, and adjusts the tick cumulative start value.
 *
 * The function also calculates the time difference between the event's block
 * timestamp and the pool's end tick timestamp, updating the pool's end tick
 * timestamp and tick cumulative end value accordingly. Finally, it updates
 * the pool's block timestamp and saves the historical pool data.
 *
 * @param event - The mint event containing the address of the pool and other relevant data.
 */
export function handleMint(event: MintEvent): void {
  const pool = Pool.load(event.address)
  const latestReward = LatestReward.load(ONE)
  if (pool == null || latestReward == null) {
    return;
  }

  let timeDiff = BigInt.zero()
  if (pool.startTickTimestamp.lt(latestReward.blockTimestamp)) {
    timeDiff = latestReward.blockTimestamp.minus(pool.startTickTimestamp)
    pool.startTickTimestamp = latestReward.blockTimestamp
    pool.tickCumulativeStart = pool.tickCumulativeStart.plus(timeDiff.times(BigInt.fromI32(pool.tick)))
  }

  timeDiff = event.block.timestamp.minus(pool.endTickTimestamp)
  pool.endTickTimestamp = event.block.timestamp
  const tick = BigInt.fromI32(pool.tick)
  pool.tickCumulativeEnd = pool.tickCumulativeEnd.plus(timeDiff.times(tick))
  pool.blockTimestamp = event.block.timestamp

  pool.save()
}

/**
 * This function processes a swap event by updating the pool's tick cumulative
 * values and timestamps, as well as calculating the TWAT (time-weighted arithmetic
 * mean tick) and updating the pool's sqrtPriceX96 value. It loads the pool and the
 * latest reward data from the storage, and if either is not found, it exits
 * early. If the pool's start tick timestamp is earlier than the latest reward's
 * block timestamp, the function calculates the time difference, updates the
 * pool's start tick timestamp, and adjusts the tick cumulative start value.
 *
 * The function also calculates the time difference between the event's block
 * timestamp and the pool's end tick timestamp, updating the pool's end tick
 * timestamp and tick cumulative end value accordingly. It then calculates the
 * expected end timestamp by adding the day in seconds to the latest reward's
 * block timestamp, and calculates the expected cumulative end value and
 * expected cumulative delta. It then calculates the TWAT and updates the pool's
 * twat value.
 *
 * Additionally, the function calculates the sqrtPriceX96 value by reversing it
 * if token1 is WETH, and updates the pool's sqrtPriceX96 value.
 *
 * Finally, it updates the pool's block timestamp and saves the historical pool
 * data.
 *
 * @param event - The swap event containing the address of the pool and other
 * relevant data.
 */
export function handleSwap(event: SwapEvent): void {
  const pool = Pool.load(event.address)
  const latestReward = LatestReward.load(ONE)
  if (pool == null || latestReward == null) {
    return;
  }

  let timeDiff = BigInt.zero()
  if (pool.startTickTimestamp.lt(latestReward.blockTimestamp)) {
    timeDiff = latestReward.blockTimestamp.minus(pool.endTickTimestamp)
    pool.startTickTimestamp = latestReward.blockTimestamp
    pool.tickCumulativeStart = pool.tickCumulativeEnd.plus(timeDiff.times(BigInt.fromI32(pool.tick)))
  }

  pool.tick = event.params.tick
  timeDiff = event.block.timestamp.minus(pool.endTickTimestamp)
  pool.endTickTimestamp = event.block.timestamp
  const tick = BigInt.fromI32(pool.tick)
  pool.tickCumulativeEnd = pool.tickCumulativeEnd.plus(timeDiff.times(tick))

  const dayInSeconds = 86_400
  timeDiff = event.block.timestamp.minus(latestReward.blockTimestamp)
  const passedDays = timeDiff.div(BigInt.fromI32(dayInSeconds))
  const expectedEndTimestamp = latestReward.blockTimestamp.plus((passedDays.plus(BigInt.fromI32(1))).times(BigInt.fromI32(dayInSeconds)))
  timeDiff = expectedEndTimestamp.minus(pool.endTickTimestamp)

  const expectedCumulativeEnd = pool.tickCumulativeEnd.plus(tick.times(timeDiff))
  const expectedCumulativeDelta = expectedCumulativeEnd.minus(pool.tickCumulativeStart)
  timeDiff = expectedEndTimestamp.minus(pool.startTickTimestamp)
  let twat = expectedCumulativeDelta.div(timeDiff)
  if (expectedCumulativeDelta.lt(BigInt.fromI32(0)) && !expectedCumulativeDelta.mod(timeDiff).isZero()) {
    twat = twat.minus(BigInt.fromI32(1))
  }
  // reverse if token1 is WETH. Price_token1/token0 = 1.0001 ^ tick, Price_token0/token1 = 1 / Price_token1/token0 =>
  // Price_token0/token1 = 1.0001 ^ -tick
  pool.twat = twat
  let sqrtPriceX96 = event.params.sqrtPriceX96
  if (pool.tokenAddress.toHexString() < WETH.toHexString()) {
    // reverse if token1 is WETH. sqrtPriceX96 = sqrt(Price_token1/token0)*2^96, Price_token1/token0 = 1 / Price_token0/token1 =>
    // sqrtPriceX96Reverse = 2^192 / ( sqrt(Price_token1/token0) * 2^96 ) = 2^192 / sqrtPriceX96 
    sqrtPriceX96 = BigInt.fromI32(2).pow(192).div(sqrtPriceX96)
  }
  pool.sqrtPriceX96 = sqrtPriceX96
  pool.blockTimestamp = event.block.timestamp

  const twatString = pool.twat.abs().toString().padStart(8, "0");
  const sqrtPriceX96String = pool.sqrtPriceX96.toString().padStart(49, "0");
  const tickString = Math.abs(pool.tick).toString().padStart(6, "0");
  pool.score = `${twatString}_${sqrtPriceX96String}_${tickString}`;

  pool.save()
}