-- ============================================
-- WALLET SYSTEM TABLES
-- ============================================

-- Table des portefeuilles utilisateur
CREATE TABLE user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    balance_cents INT DEFAULT 0 NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Ajouter stripe_customer_id à la table users si pas déjà présent
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;

-- Table des transactions de wallet
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'recharge', 'payment', 'refund'
    amount_cents INT NOT NULL,
    description TEXT,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- Si paiement pour un événement
    external_transaction_id VARCHAR(255), -- ID Stripe/Lydia/etc
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, -- 'pending', 'completed', 'failed', 'cancelled'
    metadata JSONB, -- Données supplémentaires
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des abonnements de recharge automatique
CREATE TABLE wallet_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount_cents INT NOT NULL, -- Montant de la recharge
    frequency VARCHAR(20) DEFAULT 'monthly' NOT NULL, -- 'weekly', 'monthly', 'yearly'
    external_subscription_id VARCHAR(255), -- ID Stripe subscription
    status VARCHAR(20) DEFAULT 'active' NOT NULL, -- 'active', 'paused', 'cancelled'
    next_charge_at TIMESTAMP WITH TIME ZONE,
    last_charge_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- Un seul abonnement par utilisateur pour l'instant
);

-- ============================================
-- INDEXES
-- ============================================

-- Index pour les requêtes fréquentes
CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
CREATE INDEX idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_subscriptions_user_id ON wallet_subscriptions(user_id);
CREATE INDEX idx_wallet_subscriptions_status ON wallet_subscriptions(status);
CREATE INDEX idx_wallet_subscriptions_next_charge ON wallet_subscriptions(next_charge_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_wallets
CREATE POLICY "Users can view their own wallet" ON user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON user_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour wallet_transactions
CREATE POLICY "Users can view their own transactions" ON wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques pour wallet_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON wallet_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON wallet_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON wallet_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" ON wallet_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_user_wallets_updated_at 
    BEFORE UPDATE ON user_wallets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_transactions_updated_at 
    BEFORE UPDATE ON wallet_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_subscriptions_updated_at 
    BEFORE UPDATE ON wallet_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CONTRAINTES DE VALIDATION
-- ============================================

-- Le solde ne peut pas être négatif
ALTER TABLE user_wallets ADD CONSTRAINT check_balance_non_negative 
    CHECK (balance_cents >= 0);

-- Les montants de transaction doivent être non-nuls
ALTER TABLE wallet_transactions ADD CONSTRAINT check_amount_non_zero 
    CHECK (amount_cents != 0);

-- Les montants d'abonnement doivent être positifs
ALTER TABLE wallet_subscriptions ADD CONSTRAINT check_subscription_amount_positive 
    CHECK (amount_cents > 0);

-- Types de transaction valides
ALTER TABLE wallet_transactions ADD CONSTRAINT check_valid_transaction_type 
    CHECK (type IN ('recharge', 'payment', 'refund', 'transfer'));

-- Statuts de transaction valides
ALTER TABLE wallet_transactions ADD CONSTRAINT check_valid_transaction_status 
    CHECK (status IN ('pending', 'completed', 'failed', 'cancelled'));

-- Fréquences d'abonnement valides
ALTER TABLE wallet_subscriptions ADD CONSTRAINT check_valid_frequency 
    CHECK (frequency IN ('weekly', 'monthly', 'yearly'));

-- Statuts d'abonnement valides
ALTER TABLE wallet_subscriptions ADD CONSTRAINT check_valid_subscription_status 
    CHECK (status IN ('active', 'paused', 'cancelled'));

-- Devises supportées
ALTER TABLE user_wallets ADD CONSTRAINT check_valid_currency 
    CHECK (currency IN ('EUR', 'USD', 'GBP'));
