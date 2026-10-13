---
title: Référence
description: "Chaque méthode, chaque type d'événement, chaque scope et chaque erreur de la bibliothèque."
---

La bibliothèque compte 155 méthodes réparties en 30 groupes, qui couvrent tous les endpoints de l'API Helix, et type les 83 types d'événements EventSub. Les pages de groupe et la liste des événements sont générées à partir du code source : elles sont toujours à jour avec la version publiée.

## Groupes de l'API

Chaque groupe est une propriété du client : `twitch.chat`, `twitch.moderation`... Sa page donne, pour chaque méthode, la signature, le jeton nécessaire, les paramètres, ce qui est renvoyé et un exemple.

| Groupe | Couvre | Méthodes |
| --- | --- | --- |
| [`twitch.ads`](/reference/api/ads/) | Publicités : lancer une coupure, lire le planning, repousser la prochaine. | 3 |
| [`twitch.analytics`](/reference/api/analytics/) | Rapports téléchargeables pour vos extensions et vos jeux. | 2 |
| [`twitch.bits`](/reference/api/bits/) | Bits : classement, Cheermotes, Power-ups personnalisés et transactions d'extension. | 4 |
| [`twitch.channelPoints`](/reference/api/channel-points/) | Points de chaîne : récompenses personnalisées et leurs utilisations. | 6 |
| [`twitch.channels`](/reference/api/channels/) | Chaînes : titre, catégorie et tags, éditeurs, abonnements suivis et followers. | 5 |
| [`twitch.charity`](/reference/api/charity/) | Collectes caritatives : la campagne en cours et ses dons. | 2 |
| [`twitch.chat`](/reference/api/chat/) | Chat : messages, annonces, spectateurs présents, emotes, badges, réglages, couleurs, épingles et shoutouts. | 19 |
| [`twitch.clips`](/reference/api/clips/) | Clips : créer, retrouver et télécharger. | 4 |
| [`twitch.conduits`](/reference/api/conduits/) | Conduits : le transport EventSub qui répartit les événements sur plusieurs shards. | 6 |
| [`twitch.contentLabels`](/reference/api/content-labels/) | Étiquettes de classification du contenu et leurs noms traduits. | 1 |
| [`twitch.entitlements`](/reference/api/entitlements/) | Droits liés aux Drops : les lister et les marquer comme remis. | 2 |
| [`twitch.eventsub`](/reference/api/eventsub/) | EventSub : abonnements, et écouteurs WebSocket, webhook et conduit. | 6 |
| [`twitch.extensions`](/reference/api/extensions/) | Extensions : configuration, secrets, messages PubSub et de chat, produits Bits. | 12 |
| [`twitch.games`](/reference/api/games/) | Jeux et catégories : les retrouver, lister les plus regardés. | 2 |
| [`twitch.goals`](/reference/api/goals/) | Objectifs de créateur d'une chaîne. | 1 |
| [`twitch.guestStar`](/reference/api/guest-star/) | Guest Star (bêta) : sessions, invitations et emplacements. | 12 |
| [`twitch.hypeTrain`](/reference/api/hype-train/) | Hype Train : le train en cours et les records de la chaîne. | 1 |
| [`twitch.moderation`](/reference/api/moderation/) | Modération : bannissements, timeouts, avertissements, AutoMod, termes bloqués, modérateurs, VIP et Shield Mode. | 25 |
| [`twitch.polls`](/reference/api/polls/) | Sondages : créer, lire et clore. | 3 |
| [`twitch.predictions`](/reference/api/predictions/) | Prédictions : créer, lire, verrouiller et résoudre. | 3 |
| [`twitch.raids`](/reference/api/raids/) | Raids : en lancer un, annuler celui en attente. | 2 |
| [`twitch.schedule`](/reference/api/schedule/) | Planning de diffusion : créneaux, vacances et flux iCalendar. | 6 |
| [`twitch.search`](/reference/api/search/) | Recherche de catégories et de chaînes. | 2 |
| [`twitch.streams`](/reference/api/streams/) | Streams : qui est en direct, clés de stream et marqueurs. | 5 |
| [`twitch.subscriptions`](/reference/api/subscriptions/) | Abonnements : les abonnés d'une chaîne, et savoir si un utilisateur l'est. | 2 |
| [`twitch.tags`](/reference/api/tags/) | Tags de stream (abandonnés par Twitch, conservés par souci d'exhaustivité). | 2 |
| [`twitch.teams`](/reference/api/teams/) | Équipes : en retrouver une, lister celles d'une chaîne. | 2 |
| [`twitch.users`](/reference/api/users/) | Utilisateurs : profils, liste de blocage et extensions installées. | 12 |
| [`twitch.videos`](/reference/api/videos/) | Vidéos : rediffusions, temps forts et mises en ligne. | 2 |
| [`twitch.whispers`](/reference/api/whispers/) | Chuchotements : envoyer un message privé à un utilisateur. | 1 |

## Le reste de la référence

- [Types d'événements](/reference/event-types/) : chaque type d'abonnement EventSub, sa version, sa condition et son scope.
- [Scopes](/reference/scopes/) : chaque scope OAuth et les méthodes qu'il débloque.
- [Erreurs](/reference/errors/) : chaque classe d'erreur, ses champs et quand elle est levée.
- [Options du client](/reference/client-options/) : les options de `new Twitch()`, les méthodes du client et les options de requête.
