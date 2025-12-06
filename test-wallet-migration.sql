-- Test de vérification des tables wallet
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_wallets', 'wallet_transactions', 'wallet_subscriptions');

-- Vérifier la colonne stripe_customer_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'stripe_customer_id';

-- Test d'insertion d'un wallet (remplace USER_ID par ton ID)
-- INSERT INTO user_wallets (user_id, balance_cents) 
-- VALUES ('YOUR_USER_ID', 0);
