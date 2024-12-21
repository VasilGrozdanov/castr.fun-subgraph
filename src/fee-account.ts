import { BigInt } from "@graphprotocol/graph-ts"
import {
  FeeAccount,
  Initialized,
  MigratorUpdated,
  OwnershipTransferred,
  Rewarded,
  Upgraded
} from "../generated/FeeAccount/FeeAccount"
import { ExampleEntity } from "../generated/schema"

export function handleInitialized(event: Initialized): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = ExampleEntity.load(event.transaction.from)

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new ExampleEntity(event.transaction.from)

    // Entity fields can be set using simple assignments
    entity.count = BigInt.fromI32(0)
  }

  // BigInt and BigDecimal math are supported
  entity.count = entity.count + BigInt.fromI32(1)

  // Entity fields can be set based on event parameters
  entity.version = event.params.version

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.UPGRADE_INTERFACE_VERSION(...)
  // - contract.additivePercent(...)
  // - contract.basePercent(...)
  // - contract.checkUpkeep(...)
  // - contract.collectRewardPercent(...)
  // - contract.competingTokens(...)
  // - contract.getCompetingTokenRefferences(...)
  // - contract.owner(...)
  // - contract.proxiableUUID(...)
  // - contract.rewardResolver(...)
  // - contract.swapRouter02(...)
  // - contract.treasury(...)
  // - contract.uniswapV3Migrator(...)
}

export function handleMigratorUpdated(event: MigratorUpdated): void {}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {}

export function handleRewarded(event: Rewarded): void {}

export function handleUpgraded(event: Upgraded): void {}
