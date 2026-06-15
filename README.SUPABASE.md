# Configuration de TON projet Supabase

Cette application est connectée à **ton propre projet Supabase indépendant** —
pas à un backend Lovable Cloud managé. Tu gardes 100 % du contrôle.

## 1. Crée ton projet Supabase

1. Va sur https://supabase.com → ton compte → **New project**.
2. Choisis un nom, une région et un mot de passe DB. Note bien ce mot de passe.
3. Attends la fin du provisioning (~2 min).

## 2. Récupère tes clés API

Dans ton dashboard Supabase :

- **Project Settings → API** :
  - `Project URL` → à fournir comme `APP_SUPABASE_URL`
  - `anon public` key → à fournir comme `APP_SUPABASE_ANON_KEY`
  - `service_role` key (⚠️ secret) → à fournir comme `APP_SUPABASE_SERVICE_ROLE_KEY`

Ces 3 secrets sont déjà configurés côté Lovable (Project Settings → Secrets).
Si tu changes de projet Supabase, mets-les à jour là-bas.

> **Pourquoi le préfixe `APP_` ?** Les noms `VITE_SUPABASE_*` et `SUPABASE_*` sont
> réservés par Lovable pour son intégration managée. Comme tu utilises ton propre
> projet Supabase, on utilise un préfixe libre.

## 3. Exécute la migration SQL

1. Ouvre **SQL Editor** dans ton dashboard Supabase → **New query**.
2. Copie tout le contenu de `db/migrations/0001_init.sql` (à la racine de ce repo).
3. Colle dans l'éditeur → **Run**.

Cette migration crée :

- Toutes les tables (`profiles`, `listings`, `categories`, `countries`, `regions`,
  `cities`, `communes`, `districts`, `favorites`, `conversations`, `messages`,
  `reports`, `notifications`, `shops`, `user_roles`, `settings`, etc.)
- Les enums (`listing_status`, `app_role`, etc.)
- Les **policies RLS** complètes
- Le trigger `handle_new_user` qui crée automatiquement un profil + rôle `user`
  à chaque inscription
- Le **bucket Storage public `listings`** + ses policies (upload sous
  `{user_id}/...`)
- Le **seed** : 20 catégories, Guinée + 8 régions, Conakry + 5 communes
  (Kaloum, Dixinn, Matam, Ratoma, Matoto) + ~30 quartiers principaux

## 4. Configure Auth

Dans ton dashboard Supabase :

- **Authentication → Providers → Email** : activé par défaut.
- **Authentication → URL Configuration** : ajoute l'URL de ton site (prévisualisation
  Lovable + URL publiée) dans `Site URL` et `Redirect URLs`.
- (Optionnel mais recommandé) **Authentication → Email** : active **HIBP password
  check** pour bloquer les mots de passe fuités.

## 5. Crée ton premier admin

Après ta 1ère inscription dans l'app, va dans ton dashboard Supabase :

```sql
-- Récupère ton user_id depuis auth.users, puis :
insert into public.user_roles (user_id, role)
values ('<TON-USER-ID>', 'super_admin');
```

Tu pourras alors accéder à `/admin`.

## 6. Que fait Lovable, que fait Supabase ?

| Lovable | TON Supabase |
| --- | --- |
| Génère l'interface (React, routes, formulaires) | Stocke toutes les données |
| Stocke les 3 secrets `APP_SUPABASE_*` | Auth (signup, login, sessions) |
| Build et déploie le frontend | Storage (images d'annonces) |
| | RLS, policies, triggers, fonctions |
| | Logs, dashboard, facturation, backups |

**Aucune** donnée applicative ne transite par Lovable Cloud. Tu peux quitter
Lovable à tout moment en gardant tes données dans ton projet Supabase.

## 7. Évolutions prévues

L'architecture est conçue pour ajouter facilement :

- Paiements (Stripe / Mobile Money) via Edge Functions Supabase
- Annonces sponsorisées / boost (table `payments` + `premium_options` déjà prêtes)
- Boutiques pro (table `shops` déjà prête)
- Notifications push (table `notifications` déjà prête)
- App mobile native via Capacitor (le frontend est déjà responsive)
