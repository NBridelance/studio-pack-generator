# Migration vers la nouvelle architecture modulaire

Ce document décrit la migration progressive vers une architecture modulaire pour Studio-Pack-Generator.

## 🎯 Objectifs

1. **Modularisation** : Séparer le code en packages réutilisables
2. **Découplage** : Réduire les dépendances entre modules
3. **Testabilité** : Faciliter les tests unitaires et d'intégration
4. **Maintenabilité** : Améliorer la lisibilité et la maintenance du code

## 📦 Nouveaux packages créés

### `packages/core/`
Types et utilitaires de base partagés par tous les modules.

- **types.ts** : Types centralisés (TtsConfig, PipelineConfig, PackGeneratorConfig)
- **adapters.ts** : Adaptateurs pour convertir StudioPackGenerator en configs typées

### `packages/tts-providers/`
Providers TTS avec interface standardisée.

- **interface.ts** : Interface ITtsProvider que tous les providers doivent implémenter
- **registry.ts** : Registry centralisé pour gérer les providers
- **basic-provider.ts** : Provider TTS de base (migré depuis generate/basic_tts.ts)

### `packages/external-commands/`
Gestion des commandes externes (ffmpeg, ImageMagick, etc.)

- **command-runner.ts** : Abstraction pour exécuter des commandes avec gestion WSL

## 🔄 Migration progressive

### Phase 1 : Infrastructure (✅ Terminée)
- [x] Créer la structure packages/
- [x] Définir l'interface ITtsProvider
- [x] Créer le TtsProviderRegistry
- [x] Créer CommandRunner pour les commandes externes
- [x] Créer les types centralisés dans packages/core/
- [x] Créer les adapters pour convertir StudioPackGenerator

### Phase 2 : Migration des providers TTS (🔄 En cours)
- [x] Migrer BasicTtsProvider
- [ ] Migrer OpenAI TTS Provider
- [ ] Migrer Gemini TTS Provider
- [ ] Migrer gTTS Provider
- [ ] Migrer Coqui TTS Provider
- [ ] Enregistrer tous les providers dans le registry

### Phase 3 : Refactoring du pipeline (📋 Planifiée)
- [ ] Créer packages/pipeline/
- [ ] Migrer gen_audio.ts pour utiliser le registry
- [ ] Migrer gen_image.ts
- [ ] Migrer gen_missing_items.ts
- [ ] Migrer converter.ts et serializer.ts

### Phase 4 : Restructuration apps/ (📋 Planifiée)
- [ ] Créer apps/cli/ et y déplacer les points d'entrée
- [ ] Créer apps/gui/ et séparer backend/frontend
- [ ] Créer une API REST propre pour la GUI

### Phase 5 : Finalisation (📋 Planifiée)
- [ ] Déplacer test_data/ et stories/ vers examples/
- [ ] Mettre à jour toute la documentation
- [ ] Tests d'intégration complets
- [ ] Release 1.0 avec nouvelle architecture

## 🔧 Utilisation

### Import maps dans deno.json

Les nouveaux packages sont accessibles via des alias :

```typescript
import { TtsConfig } from "@spg/core/types.ts";
import { ITtsProvider } from "@spg/tts-providers/interface.ts";
import { CommandRunner } from "@spg/external-commands/command-runner.ts";
```

### Exemple : Utiliser un provider TTS

```typescript
import { BasicTtsProvider } from "@spg/tts-providers/basic-provider.ts";
import type { TtsSynthesizeParams } from "@spg/tts-providers/interface.ts";

const provider = new BasicTtsProvider();

// Vérifier la disponibilité
const available = await provider.isAvailable({ lang: "fr-FR" });

if (available) {
  // Synthétiser
  await provider.synthesize({
    title: "Bonjour le monde",
    outputPath: "./output.wav",
    lang: "fr-FR",
    options: {
      cachePath: "~/.cache/tts",
      skipWsl: false,
    },
  });
}
```

### Exemple : Conversion de StudioPackGenerator

```typescript
import { toTtsConfig, toPipelineConfig } from "@spg/core/adapters.ts";
import type { StudioPackGenerator } from "./studio_pack_generator.ts";

function processWithNewArchitecture(opt: StudioPackGenerator) {
  // Convertir en configs typées
  const ttsConfig = toTtsConfig(opt);
  const pipelineConfig = toPipelineConfig(opt);
  
  // Utiliser les configs
  console.log(`Provider: ${ttsConfig.provider}`);
  console.log(`Skip audio convert: ${pipelineConfig.skipAudioConvert}`);
}
```

## 🧪 Tests

Les tests doivent être colocalisés avec le code source (`*_test.ts`).

```bash
# Tester un package spécifique
deno test packages/tts-providers/

# Tester tout le projet
deno task test
```

## 📚 Compatibilité

**Migration progressive** : Le code existant continue de fonctionner grâce aux adapters.

- `generate/basic_tts.ts` exporte toujours `generate_audio_basic_tts()` pour compatibilité
- Les fonctions legacy appellent les nouvelles implémentations en interne
- Aucun changement breaking pour les utilisateurs

## 🚀 Prochaines étapes

1. **Compléter la migration des providers TTS** (OpenAI, Gemini, gTTS, Coqui)
2. **Créer packages/pipeline/** pour la logique métier
3. **Restructurer en apps/cli/ et apps/gui/**
4. **Documentation complète** avec exemples d'utilisation
5. **Publier packages sur JSR** pour réutilisation externe

## 💡 Avantages de la nouvelle architecture

- ✅ **Réutilisabilité** : Les packages peuvent être utilisés indépendamment
- ✅ **Testabilité** : Interfaces standardisées facilitent le mocking
- ✅ **Extensibilité** : Facile d'ajouter de nouveaux providers
- ✅ **Découplage** : Moins de dépendances circulaires
- ✅ **Maintenabilité** : Code plus organisé et documenté
- ✅ **Performances** : Cache TTS centralisé et optimisé

## 📞 Support

Pour toute question sur la migration, consulter :
- [ARCHITECTURE.md](./ARCHITECTURE.md) : Plan détaillé
- [README.md](../README.md) : Documentation utilisateur
- Issues GitHub : Signaler des problèmes
