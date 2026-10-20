# CleanFrame LG

Portage de CleanFrame pour les téléviseurs LG webOS, réalisé par **Naim**.

Ce projet reprend le code et le design de **[CleanFrame](https://github.com/nthnclrk/CleanFrame)**, créé par **[Nathan Clark (@nthnclrk)](https://github.com/nthnclrk)** pour Samsung The Frame. L'idée originale, les dispositions Dock/List et l'essentiel du moteur visuel viennent de son travail. Naim a adapté l'intégration à LG webOS et ajouté un lecteur vidéo d'ambiance. Merci à Nathan d'avoir partagé son projet sous licence MIT et encouragé les adaptations.

Cette adaptation est indépendante ; elle n'est ni approuvée ni maintenue par Nathan Clark, LG, Samsung ou les services de streaming.

## Fonctions LG

- Interface photographique, dispositions Dock/List, focus télécommande et préférences locales conservés.
- Lancement d'applications déjà installées par l'API publique LG ; leurs comptes restent dans leurs applications respectives.
- Catalogue des applications configurées, vérifié par `getAppLoadStatus`.
- Lecteur vidéo d'ambiance interne : boucle, lecture silencieuse, OK pour pause/reprise, Retour pour fermer.
- Installation additive via Developer Mode et le CLI officiel LG, sans root.

L'interface et les cinq cibles Netflix, YouTube, Prime Video, Stremio et Apple TV ont été testées sur une LG OLED B4 sous webOS 25. Ce constat ne garantit pas la compatibilité avec tous les modèles, régions ou firmwares. Les IDs de `webos/apps.json` sont des identifiants publics d'applications, pas des mots de passe ou des comptes.

## Limites

Home reste le bouton de l'accueil LG. Retour appartient à l'application active ; CleanFrame ne peut pas intercepter globalement les touches dans Netflix ou Stremio. Aucun démarrage automatique ou remplacement de l'accueil système n'est fourni. Un raccourci numérique Accès rapide LG peut rouvrir CleanFrame si le modèle l'accepte.

Developer Mode a une durée limitée : prolonger sa session avec EXTEND avant expiration. Sa désactivation peut supprimer les applications de développement. Ne pas utiliser Clear Cache Data, qui affecte les caches des autres applications.

Le lecteur d'ambiance n'est pas le Samsung Art Mode ni un mode matériel LG basse consommation. Il n'altère pas les protections OLED du système. La 4K dépend du média et du décodeur ; la jonction de boucle peut présenter une transition.

## Compiler dans le cloud

Dans Actions, lancer manuellement **Build LG preview**. Le workflow vérifie les sources, utilise les polices publiques et empaquette l'application avec le CLI officiel LG. L'artefact contient un IPK et son empreinte SHA-256. Aucun secret TV ni accès réseau domestique n'est nécessaire au build.

Ce dépôt ne contient ni clé SSH, ni adresse de TV, ni passphrase, ni journal de connexion, ni vidéo personnelle. Le workflow ne contient pas la vidéo de l'installation de démonstration. Sans média fourni, le bouton d'ambiance indique qu'aucun fichier n'est inclus.

## Préparation locale

Prérequis : Node.js 22+, Python 3.10+, CLI officiel `@webos-tools/cli` et bibliothèque officielle LG webOSTV.js 1.2.13. Consulter [les outils LG](https://webostv.developer.lge.com/develop/tools/cli-installation) et [webOSTV.js](https://webostv.developer.lge.com/develop/references/webostvjs-introduction).

```text
npm ci
npm run check
npm run check:lg
npm run check:public
```

Définir `CLEANFRAME_WEBOSTV_JS` vers le fichier officiel webOSTV.js, avec sa licence adjacente. Facultativement, définir `CLEANFRAME_ART_VIDEO` vers une vidéo MP4 ou WebM que vous êtes autorisé à utiliser. Garder ce média dans `.local/`. Puis :

```text
npm run prepare:lg
ares-package dist/webos-app -o dist
```

Les sources `app/` conservent le moteur et l'adaptateur Tizen d'origine pour comparaison. La préparation LG remplace l'adaptateur, les IDs et les métadonnées dans `dist/webos-app`. Ne pas installer le manifeste Tizen sur une LG. Les documents historiques sous `docs/` décrivent le projet Samsung d'origine ; ce README décrit l'adaptation LG.

Pour l'installation, suivre [Developer Mode LG](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app) depuis un ordinateur autorisé sur le même réseau. La configuration d'appareil et sa clé restent sur cet ordinateur. Ne jamais les ajouter au dépôt ou aux journaux Actions.

## Licence et crédits

Le code original est sous [licence MIT](LICENSE), copyright Nathan Clark, conservé. Les ajouts LG de Naim sont également fournis sous MIT. Les polices, photographies et marques gardent leurs conditions dans [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). La licence du code ne donne pas de droit de redistribution sur une vidéo YouTube : aucun fichier vidéo téléchargé n'est inclus.

Voir [CREDITS.md](CREDITS.md) et [PRIVACY-REVIEW.md](PRIVACY-REVIEW.md).
