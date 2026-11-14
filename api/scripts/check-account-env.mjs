if (process.env.NODE_ENV === 'production') throw new Error('Local accounts are disabled in production.')
if (!process.env.LOCAL_ACCOUNT_PASSWORD || process.env.LOCAL_ACCOUNT_PASSWORD.length < 8) {
  throw new Error('Set LOCAL_ACCOUNT_PASSWORD (at least 8 characters) in api/.env.')
}
