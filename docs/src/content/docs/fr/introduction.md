---
title: "Introduction"
description: "Ce qu'est twitch.api, ce qu'elle couvre, ce qu'il lui faut pour fonctionner et comment cette documentation est organisée."
---

twitch.api est un client de l'API Twitch pour JavaScript et TypeScript. Vous appelez une méthode, vous recevez des données typées. Les jetons, les limites de débit, la pagination et les reconnexions sont gérés par la bibliothèque, et elle n'a aucune dépendance.

## Ce qu'elle couvre

- **L'API Helix** : les 149 endpoints, répartis en 30 groupes comme `twitch.users`, `twitch.chat` et `twitch.moderation`. Les paramètres et les réponses gardent les noms que Twitch utilise : la référence officielle et cette bibliothèque se lisent donc de la même façon.
- **EventSub** : les 83 types d'abonnement, chacun avec une condition typée et un événement typé. Un seul `on()` fonctionne en WebSocket, en webhooks et avec les conduits.
- **OAuth** : le jeton d'application, les jetons utilisateur, le flux par code d'autorisation et le flux par code d'appareil, avec le renouvellement, la validation et le stockage.

## À quoi ça ressemble

Les données publiques demandent un identifiant client et un secret client, rien de plus.

```ts
import { Twitch } from "@ix-xs/twitch.api";

const twitch = new Twitch({ clientId, clientSecret });

// Un utilisateur, par son nom de connexion.
const user = await twitch.users.getByLogin("twitchdev");

// Les dix streams les plus regardés en ce moment.
const top = await twitch.streams.get().take(10);

console.log(user?.display_name, top.map((stream) => stream.user_name));
```

Agir pour un utilisateur, par exemple lire et envoyer des messages dans le chat, demande un jeton de cet utilisateur. Une fois l'utilisateur connecté, les appels s'écrivent de la même façon.

```ts
const events = twitch.eventsub.websocket();

events.on("channel.chat.message", { broadcaster_user_id: channelId, user_id: botId }, async (event) => {
  if (event.message.text === "!ping") {
    await twitch.chat.send({ broadcaster_id: channelId, message: "pong" });
  }
});
```

## Ce qu'elle fait pour vous

- Elle demande le jeton d'application quand un appel en a besoin, renouvelle les jetons utilisateur avant leur expiration et les valide toutes les heures, comme Twitch l'exige. Voir [Les jetons en un coup d'œil](/auth/overview/).
- Elle choisit le jeton que chaque endpoint attend, celui de l'application ou celui d'un utilisateur, et remplit `moderator_id`, `broadcaster_id` ou `sender_id` avec l'utilisateur qui agit. Voir [Agir au nom d'un utilisateur](/basics/acting-as-a-user/).
- Elle vérifie les scopes d'un jeton avant d'envoyer la requête, et l'erreur nomme le scope qui manque.
- Elle suit les curseurs à votre place : `await` sur une liste donne une page, une boucle `for await` donne tous les éléments. Voir [Pagination](/basics/pagination/).
- Elle lit les en-têtes de limite de débit de chaque réponse : les requêtes attendent que la limite se réinitialise au lieu d'échouer, et ce qui peut être retenté sans risque l'est. Voir [Limites de débit et nouvelles tentatives](/basics/rate-limits-and-retries/).
- Elle maintient les connexions EventSub : reconnexions, réabonnements, vérification des signatures et livraisons en double. Voir [Recevoir des événements](/events/overview/).
- Elle transforme les échecs en erreurs typées qui portent le statut et le message envoyés par Twitch. Voir [Erreurs](/basics/errors/).

## Ce qu'il vous faut

- **Node.js 22 ou une version ultérieure.** La bibliothèque fonctionne aussi sur Bun, Deno, Cloudflare Workers et dans le navigateur, voir [Runtimes](/basics/runtimes/).
- **Une application Twitch**, qui vous donne un identifiant client et un secret client. En enregistrer une prend quelques minutes : [Obtenir vos identifiants](/credentials/).

TypeScript est facultatif. Les déclarations de types sont livrées avec le paquet : un éditeur complète donc les noms de méthode, les paramètres, les scopes et les types d'événement dans les fichiers JavaScript aussi.

## Comment cette documentation est organisée

- **Démarrer** : cette page, le [démarrage rapide](/quick-start/) et la marche à suivre pour obtenir vos identifiants.
- **Bases** : le fonctionnement de toutes les méthodes. [Appeler l'API](/basics/calling-the-api/) est la page à lire une fois, les autres traitent chacune un sujet.
- **Authentification** : les jetons utilisateur, de la connexion d'un utilisateur au [stockage des jetons](/auth/storing-tokens/).
- **Événements** : EventSub en [WebSocket](/events/websocket/), en [webhooks](/events/webhooks/) et avec les [conduits](/events/conduits/).
- **Recettes** : des programmes complets à copier, comme un [bot de chat](/recipes/chat-bot/).
- **Référence** : [toutes les méthodes](/reference/overview/), tous les [types d'événement](/reference/event-types/) et tous les [scopes](/reference/scopes/), générés à partir du code source de la bibliothèque, puis le [dépannage](/help/troubleshooting/) et les [questions les plus fréquentes](/help/faq/).

Tous les exemples de ce site sont compilés avec la bibliothèque avant la publication du site.

## Par où commencer

- Vous découvrez la bibliothèque : le [démarrage rapide](/quick-start/) part d'un dossier vide et arrive à un premier appel.
- Vous venez de la version 1 : [Depuis la version 1](/help/migrating-from-v1/) donne le nouveau nom de chaque ancienne méthode.
- Vous cherchez un endpoint précis : la recherche de ce site connaît chaque méthode et chaque type d'événement.

twitch.api est un projet open source indépendant, publié sous licence MIT. Il n'est ni affilié à Twitch Interactive, Inc. ni approuvé par cette société.
