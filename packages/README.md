# Packages SPG

Ce dossier contient les packages modulaires réutilisables de Studio-Pack-Generator.

## 📦 Structure

```
packages/
├── core/                    # Types et utilitaires de base
│   ├── types.ts            # Types centralisés (TtsConfig, PipelineConfig)
│   ├── adapters.ts         # Adaptateurs pour migration progressive
│   └── mod.ts              # Export centralisé
│
├── tts-providers/          # Providers TTS avec interface standardisée
│   ├── interface.ts        # ITtsProvider interface
│   ├── registry.ts         # TtsProviderRegistry
│   ├── basic-provider.ts   # Provider Basic TTS
│   └── [À venir: openai, gemini, gtts, coqui]
│
└── external-commands/      # Gestion des commandes externes
    └── command-runner.ts   # CommandRunner avec support WSL
```

## 🎯 Objectif

Séparer le code en modules réutilisables et indépendants pour :
- ✅ Faciliter la maintenance
- ✅ Améliorer la testabilité
- ✅ Permettre la réutilisation dans d'autres projets
- ✅ Réduire le couplage entre composants

## 📚 Utilisation

### Avec les import maps (deno.json)

```typescript
import { TtsConfig } from "@spg/core/types.ts";
import { ITtsProvider } from "@spg/tts-providers/interface.ts";
import { BasicTtsProvider } from "@spg/tts-providers/basic-provider.ts";
import { getCommandRunner } from "@spg/external-commands/command-runner.ts";
```

### Sans import maps

```typescript
import { TtsConfig } from "../packages/core/types.ts";
import { ITtsProvider } from "../packages/tts-providers/interface.ts";
```

## 🔄 Migration

La migration est progressive. Le code existant continue de fonctionner :

1. **Phase actuelle** : Infrastructure de base créée
2. **Prochaine phase** : Migration des providers TTS
3. **Phases suivantes** : Pipeline, apps/, finalisation

Voir [MIGRATION.md](../docs/MIGRATION.md) pour le plan complet.

## 🧪 Tests

Les tests sont colocalisés avec le code source :

```bash
# Tester tous les packages
deno test packages/

# Tester un package spécifique
deno test packages/tts-providers/
```

## 📖 Documentation

- **[types.ts](./core/types.ts)** : Types centralisés avec JSDoc
- **[interface.ts](./tts-providers/interface.ts)** : Interface ITtsProvider
- **[command-runner.ts](./external-commands/command-runner.ts)** : Abstraction commandes

## 🚀 Contribution

Pour ajouter un nouveau package :

1. Créer le dossier `packages/mon-package/`
2. Créer `mod.ts` pour les exports
3. Ajouter l'import map dans `deno.json`
4. Documenter dans ce README

## 📦 Packages à créer

- [ ] `packages/pipeline/` - Logique de génération de packs
- [ ] `packages/serialization/` - Sérialisation/désérialisation
- [ ] `packages/rss/` - Gestion des flux RSS
- [ ] `packages/utils/` - Utilitaires partagés (i18n, queue, etc.)

---

**Maintaineur** : Studio-Pack-Generator Team  
**License** : MIT
