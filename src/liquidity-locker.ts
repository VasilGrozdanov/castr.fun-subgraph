import {
    LiquidityMigrated as LiquidityMigratedEvent,
} from "../generated/LiquidityLocker/ILiquidityLocker"
import {
    LiquidityLock, MigratedPool
} from "../generated/schema"

export function handleLiquidityMigrated(event: LiquidityMigratedEvent): void {
    const liquidityLock = LiquidityLock.load(event.params.tokenId.toString())
    const migratedPool = MigratedPool.load(event.params.pool)
    const locker = event.params.locker;


    if (liquidityLock != null) {
        liquidityLock.locker = locker
        liquidityLock.save()
    }
    if (migratedPool != null) {
        migratedPool.locker = locker
        migratedPool.save()
    }
}

