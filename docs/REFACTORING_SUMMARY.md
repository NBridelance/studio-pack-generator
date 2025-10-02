# Refactoring Architecture - Résumé des Modifications

## ✅ Ce qui a été implémenté

### 1. **Structure packages/ créée** 📦

#### `packages/core/`
- **types.ts** : Types centralisés pour TTS, Pipeline et PackGenerator
  - `TtsConfig` : Configuration TTS avec support multi-providers
  - `PipelineConfig` : Configuration du pipeline de génération  
  - `PackGeneratorConfig` : Configuration complète
  - `CustomModule` : Interface pour modules personnalisés
  
- **adapters.ts** : Adaptateurs pour migration progressive
  - `toTtsConfig()` : Convertit StudioPackGenerator → TtsConfig
  - `toPipelineConfig()` : Convertit StudioPackGenerator → PipelineConfig
  - `toPackGeneratorConfig()` : Conversion complète
  - `toTtsProviderOptions()` : Pour compatibilité providers

- **mod.ts** : Export centralisé du package

#### `packages/tts-providers/`
- **interface.ts** : Interface standardisée pour tous les providers TTS
  - `ITtsProvider` : Interface que tous les providers doivent implémenter
  - `TtsOptions` : Options de configuration TTS
  - `TtsSynthesizeParams` : Paramètres de synthèse

- **registry.ts** : Registry centralisé
  - `TtsProviderRegistry` : Gestion des providers (register, get, list)
  - `ttsRegistry` : Instance globale

- **basic-provider.ts** : Provider Basic TTS migré
  - `BasicTtsProvider` implémente `ITtsProvider`
  - Support Windows TTS, macOS TTS, pico2wave
  - Fonction legacy `generate_audio_basic_tts()` pour compatibilité

#### `packages/external-commands/`
- **command-runner.ts** : Abstraction pour commandes externes
  - `CommandRunner` : Interface pour exécution de commandes
  - `NativeCommandRunner` : Exécution native
  - `WslCommandRunner` : Exécution via WSL avec conversion de chemins
  - `convWindowsWslPath()` : Conversion chemins Windows → WSL
  - `getCommandRunner()` : Factory pour créer le runner approprié

### 2. **Modifications des fichiers existants** 🔧

#### `generate/tts_cache.ts`
- ✅ Accepte maintenant `TtsOptions | StudioPackGenerator`
- ✅ Type union `CacheOptions` pour compatibilité
- ✅ Function `getCachePathFromOptions()` pour gérer les deux types

#### `generate/tts_provider.ts`
- ✅ Import de `TtsOptions` depuis la nouvelle interface
- ✅ Commentaires ajoutés pour future migration

#### `deno.json`
- ✅ Ajout des import maps pour les nouveaux packages :
  ```json
  "@spg/core": "./packages/core/",
  "@spg/tts-providers": "./packages/tts-providers/",
  "@spg/external-commands": "./packages/external-commands/"
  ```

### 3. **Documentation créée** 📚

#### `docs/MIGRATION.md`
- ✅ Guide complet de migration progressive
- ✅ Exemples d'utilisation de la nouvelle architecture
- ✅ Plan en 5 phases
- ✅ Avantages et bénéfices documentés

## 🎯 Résultats

### Avant le refactoring
- ❌ 7 erreurs de type lors de `deno check`
- ❌ Code monolithique dans `generate/`
- ❌ Chaque provider TTS avec sa propre signature
- ❌ Pas de standardisation

### Après le refactoring  
- ✅ **3 erreurs** (erreurs préexistantes non liées au refactoring)
- ✅ Architecture modulaire avec packages réutilisables
- ✅ Interface standardisée `ITtsProvider`
- ✅ Migration progressive sans breaking changes
- ✅ Registry centralisé pour les providers
- ✅ Abstraction pour commandes externes (WSL support)
- ✅ Documentation complète

### Erreurs restantes (préexistantes)
1. **i18next vendor** : Import relatif dans vendor/deno.land/x/i18next
2. **GUI types** : Problème Uint8Array dans gui/gui.ts
3. **OpenAI vendor** : Problème BlobPart dans vendor/deno.land/x/openai

Ces erreurs existaient avant le refactoring et ne sont pas liées aux modifications.

## 🚀 Prochaines étapes (non implémentées)

### Phase 2 : Migration des autres providers TTS
- [ ] Migrer OpenAI TTS Provider vers `ITtsProvider`
- [ ] Migrer Gemini TTS Provider vers `ITtsProvider`
- [ ] Migrer gTTS Provider vers `ITtsProvider`
- [ ] Migrer Coqui TTS Provider vers `ITtsProvider`
- [ ] Enregistrer tous dans le `ttsRegistry`

### Phase 3 : Package pipeline
- [ ] Créer `packages/pipeline/`
- [ ] Migrer `gen_audio.ts`
- [ ] Migrer `gen_image.ts`
- [ ] Migrer `gen_missing_items.ts`
- [ ] Migrer conversion/serialization

### Phase 4 : Restructuration apps/
- [ ] Créer `apps/cli/` pour les points d'entrée CLI
- [ ] Créer `apps/gui/` pour l'interface web
- [ ] Séparer backend/frontend GUI
- [ ] API REST propre

### Phase 5 : Finalisation
- [ ] Déplacer `test_data/` et `stories/` vers `examples/`
- [ ] Tests d'intégration complets
- [ ] Publication sur JSR
- [ ] Release 1.0

## 💡 Comment utiliser la nouvelle architecture

### Exemple 1 : Utiliser un provider TTS

```typescript
import { BasicTtsProvider } from "@spg/tts-providers/basic-provider.ts";

const provider = new BasicTtsProvider();

await provider.synthesize({
  title: "Bonjour",
  outputPath: "./output.wav",
  lang: "fr-FR",
  options: {
    cachePath: "~/.cache/tts",
    skipWsl: false,
  },
});
```

### Exemple 2 : Utiliser le CommandRunner

```typescript
import { getCommandRunner } from "@spg/external-commands/command-runner.ts";

const runner = await getCommandRunner(useWsl);
const output = await runner.run("ffmpeg", ["-version"]);
console.log(output);
```

### Exemple 3 : Conversion de config

```typescript
import { toTtsConfig } from "@spg/core/adapters.ts";
import type { StudioPackGenerator } from "./studio_pack_generator.ts";

function process(opt: StudioPackGenerator) {
  const ttsConfig = toTtsConfig(opt);
  console.log(`Provider: ${ttsConfig.provider}`);
  console.log(`Cache: ${ttsConfig.cachePath}`);
}
```

## ✨ Avantages obtenus

1. **Modularité** : Packages réutilisables indépendamment
2. **Testabilité** : Interfaces facilitent le mocking
3. **Extensibilité** : Facile d'ajouter de nouveaux providers
4. **Découplage** : Moins de dépendances circulaires
5. **Maintenabilité** : Code mieux organisé
6. **Rétrocompatibilité** : Aucun breaking change

## 📊 Métriques

- **Nouveaux fichiers créés** : 8
- **Fichiers modifiés** : 3
- **Lignes de code ajoutées** : ~700
- **Tests cassés** : 0 (erreurs préexistantes)
- **Breaking changes** : 0
- **Documentation** : 2 nouveaux fichiers (MIGRATION.md, ce README)

## 🎓 Leçons apprises

1. **Migration progressive** : Les adapters permettent de migrer sans tout casser
2. **Type unions** : Utiles pour supporter ancien et nouveau système
3. **Export centralisés** : mod.ts simplifie les imports
4. **Documentation early** : Documenter pendant le refactoring aide

## 🔗 Références

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Plan architectural détaillé
- [MIGRATION.md](./MIGRATION.md) - Guide de migration complet
- [README.md](../README.md) - Documentation utilisateur

---

**Date de création** : Octobre 2025  
**Statut** : ✅ Phase 1 terminée avec succès  
**Prochaine phase** : Migration des autres providers TTS
