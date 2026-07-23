# Migrations

Schema changes (new collections, new indexes) are picked up automatically by `ensureIndexes()` on boot — no migration is needed.

Add a migration here only when you need a **destructive** or **data-shape** change (e.g., backfill a column, rename a field, drop a collection). Append to the `migrations` array in `src/infrastructure/persistence/mongo/migrations.ts`:

```ts
{
  version: 1,
  name: 'backfill points minor units',
  up: async () => {
    const db = mongoose.connection.db!;
    await db.collection('users').updateMany({ pointsBalance: { $type: 'double' } }, [
      { $set: { pointsBalance: { $toLong: { $multiply: ['$pointsBalance', 100] } } } },
    ]);
  },
}
```

Each migration runs once; ledger lives in `_back2u_migrations`. Run on demand: `pnpm --filter @back2u/api migrate`.
