import {
  Rewarded as RewardEvent,
  MigratorUpdated as MigratorUpdatedEvent,
} from "../generated/FeeAccount/FeeAccount"
import {
  Pool,
  Reward,
  LatestReward
} from "../generated/schema"
import { LiquidityMigrator } from "../generated/templates"
import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { ONE } from "./constants";

/**
* Handles a reward event by updating the pool's isRewarded property, creating
* a new Reward entity, and updating the LatestReward entity.
*
* All rewarded pools must be rewarded on the same block.
* If the reward's timestamp is later than the latest reward's timestamp, the
* function resets the list of rewarded pools and the total amount.
*
* @param event - The reward event containing the pool address, token address,
* amount, and timestamp.
*/
export function handleRewarded(event: RewardEvent): void {
  let latestReward = LatestReward.load(ONE)
  if (latestReward == null) {
    latestReward = new LatestReward(ONE)
    latestReward.totalAmount = BigInt.zero()
    latestReward.rewarded = new Array<Bytes>()
    latestReward.blockTimestamp = event.block.timestamp
    latestReward.save()
  }
  let pool = Pool.load(event.params.pool)
  if (pool == null) {
    return;
  }

  pool.isRewarded = true
  const reward = new Reward(event.params.pool)
  reward.token = event.params.token
  reward.amount = event.params.amount
  reward.blockTimestamp = event.params.timestamp
  if (reward.blockTimestamp > latestReward.blockTimestamp) {
    latestReward.rewarded = new Array<Bytes>()
    latestReward.totalAmount = BigInt.zero()
    latestReward.blockTimestamp = event.block.timestamp
  }
  latestReward.rewarded.push(reward.id)
  latestReward.totalAmount = latestReward.totalAmount.plus(reward.amount)

  pool.save()
  reward.save()
  latestReward.save()
}

/**
 * Handles a MigratorUpdated event by creating a new LiquidityMigrator entity with
 * the new address.
 *
 * @param event - The MigratorUpdated event containing the new address.
 */
export function handleMigratorUpdated(event: MigratorUpdatedEvent): void {
  LiquidityMigrator.create(event.params.newMigrator)
}

