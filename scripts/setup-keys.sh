#!/usr/bin/env bash
# Generate fresh secrets (VAPID, vault master key, JWT pair).
# Pipe into your secret manager — does NOT mutate any local files.
#
# Usage:
#   ./scripts/setup-keys.sh                   # print to stdout
#   ./scripts/setup-keys.sh > .env.secrets    # save to a file
#
set -euo pipefail

node - <<'NODE'
const crypto = require('crypto');
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const pub = publicKey.export({ format: 'jwk' });
const priv = privateKey.export({ format: 'jwk' });
const b64url = (b) => b.replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const xy = Buffer.concat([Buffer.from([0x04]), Buffer.from(pub.x, 'base64'), Buffer.from(pub.y, 'base64')]);
console.log('# Generated', new Date().toISOString());
console.log('VAPID_PUBLIC_KEY=' + b64url(xy.toString('base64')));
console.log('VAPID_PRIVATE_KEY=' + b64url(Buffer.from(priv.d, 'base64').toString('base64')));
console.log('VAULT_MASTER_KEY=' + crypto.randomBytes(32).toString('base64'));
console.log('JWT_ACCESS_SECRET=' + crypto.randomBytes(32).toString('base64'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(32).toString('base64'));
NODE
