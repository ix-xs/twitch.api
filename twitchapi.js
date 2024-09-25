/* eslint-disable no-trailing-spaces */

const { writeFileSync } = require("node:fs");
const TwitchTokenPath = process.cwd() + "/node_modules/@ix-xs/twitch.api/Token.json";
let TwitchToken = require(TwitchTokenPath);

module.exports = class {

	/**
	 * **Instance client**
	 * 
	 * ---
	 * @param {{
	 * client_id:string,
	 * client_secret:string,
	 * }} config - Vos identifiants client Twitch
	 * 
	 * ---
	 * @example
	 * const client = new twitchAPI({ client_id:"votre_client_id", client_secret:"votre_client_secret" });
	 */
	constructor(config) {

        this.clientId = config.client_id;
        this.clientSecret = config.client_secret;
        this.token = TwitchToken;
        this.validateInterval = null;

	}

    /**
     * 👀 **Démarre le client**  
     * 💡 **Note** : Cette fonction est requise afin de démarrer la surveillance du token qui doit maintenant être valider toutes les heures
     * 
     * ---
     * @example
     * await client.initialize();
     */
	async initialize() {
        if (this.isExpiredToken()) {
            await this.refreshToken();
        }
        await this.validateToken();
        this.startPeriodicValidation();
    }
	/**
	 * 👀 **Génère un nouveau token**  
	 * 💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * error?:string,
	 * result?:{
	 * created_at:number,
	 * access_token:string,
	 * expires_in:number,
	 * token_type:string,
	 * }
	 * }>} **Renvoi une promesse d'objet** :
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la génération du token  
	 * • `result?` : Résultat  
	 * > • `created_at` : Date de la création du token  
	 * > • `access_token` : Le code (token) généré  
	 * > • `expires_in` : Délais (en secondes) de l'expiration du token  
	 * > • `token_type` : Le type du token ("Bearer")
	 * 
	 * ---
	 * @example
	 * client.generateToken().then(console.log);
	 * 
	 * // Exemple de réponse :
	 * // {
	 * //   ok: true,
	 * //   result: {
	 * //     created_at: 1637167088,
	 * //     access_token: "abcdefgh123456789",
	 * //     expires_in: 3600,
	 * //     token_type: "Bearer",
	 * //   },
	 * // }
	 */
	async generateToken() {
        try {
            const response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${this.clientId}&client_secret=${this.clientSecret}&grant_type=client_credentials`, {
                method: "POST",
            });

            if (!response.ok) {
                return { ok: false, statusText: response.statusText };
            }

            const result = await response.json();
            result.token_type = "Bearer";
            result.created_at = new Date().getTime();
            this.updateTokenFile(result);
            return { ok: true, result };
        } catch (error) {
            return { ok: false, error: error.stack };
        }
    }
	/**
	 * 👀 **Renvoi la validité du token actuel**
	 * 
	 * ---
	 * @returns {boolean} **Renvoi `true` si le token a expiré, sinon `false`**
	 * 
	 * ---
	 * @example
	 * console.log(client.isExpiredToken());
	 * 
	 * // Exemple de réponse :
	 * // true
	 */
	isExpiredToken() {
        if (!this.token.access_token || this.token.access_token === "") {
            return true;
        }

        const now = Math.floor(Date.now() / 1000);
        const createdAt = Math.floor(this.token.created_at / 1000);
        const expiresIn = this.token.expires_in;
        const expirationTime = createdAt + expiresIn;

        return now >= expirationTime;
    }
	/**
	 * 👀 **Génère un nouveau token**  
	 * 💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * error?:string,
	 * result?:{
	 * created_at:number,
	 * access_token:string,
	 * expires_in:number,
	 * token_type:string,
	 * }
	 * }>} **Renvoi une promesse d'objet** :
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la génération du token  
	 * • `result?` : Résultat  
	 * > • `created_at` : Date de la création du token  
	 * > • `access_token` : Le code (token) généré  
	 * > • `expires_in` : Délais (en secondes) de l'expiration du token  
	 * > • `token_type` : Le type du token ("Bearer")
	 * 
	 * ---
	 * @example
	 * client.refreshToken().then(console.log);
	 * 
	 * // Exemple de réponse :
	 * // {
	 * //   ok: true,
	 * //   result: {
	 * //     created_at: 1637167088,
	 * //     access_token: "abcdefgh123456789",
	 * //     expires_in: 3600,
	 * //     token_type: "Bearer",
	 * //   },
	 * // }
	 */
	async refreshToken() {
        try {
            const newToken = await this.generateToken();

            if (!newToken.ok) {
                return { ok: false, error: newToken.error ?? newToken.statusText };
            }

            this.updateTokenFile(newToken.result);
            return { ok: true, result: newToken.result };
        } catch (error) {
            return { ok: false, error: error.stack };
        }
    }
    /**
     * 👀 **Valide le token**  
     * 💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion
     * 
     * ---
     * @example
     * await client.validateToken();
     */
	async validateToken() {
        try {
            if (!this.token.access_token || this.token.access_token === "") {
                await this.refreshToken();
            }

            const response = await fetch(`https://id.twitch.tv/oauth2/validate`, {
                headers: {
                    Authorization: `Bearer ${this.token.access_token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    await this.refreshToken();
                    return this.validateToken();
                }
                return { ok: false, statusText: response.statusText };
            }

            const result = await response.json();
            return { ok: true, result };
        } catch (error) {
            return { ok: false, error: error.stack };
        }
    }
    /**
     * 👀 **Met à jour le token**  
     * 💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion
     * 
     * ---
     * @example
     * await client.updateTokenFile();
     */
	updateTokenFile(tokenData) {
        writeFileSync(TwitchTokenPath, JSON.stringify(tokenData, null, 4));
        this.token = tokenData;
        TwitchToken = tokenData;
    }
    /**
     * 👀 **Démarre la surveillance pour la validation periodique du token (toutes les heures)**  
     * 💡 **Note** : Le token se gère de façon automatique, cette fonction sert uniquement a son auto-gestion
     * 
     * ---
     * @example
     * await client.startPeriodicValidation();
     */
	startPeriodicValidation() {
        if (this.validateInterval) {
            clearInterval(this.validateInterval);
        }
        this.validateInterval = setInterval(async () => {
            const validation = await this.validateToken();
            if (!validation.ok) {
                console.error("Token validation failed:", validation.error || validation.statusText);
            }
        }, 3600000); // 1 hour in milliseconds
    }
	/**
	 * 👀 **Renvoi une liste des streams**  
	 * 💡 **Note** : La liste est classée par ordre décroissant du nombre de téléspectateurs regardant le flux. Étant donné que les spectateurs vont et viennent pendant un flux, il est possible de trouver des flux en double ou manquants dans la liste au fur et à mesure que vous parcourez les résultats.
	 * 
	 * ---
	 * @param {{
	 * users_names?:Array<string>,
	 * games_names?:Array<string>,
	 * type?:"all"|"live",
	 * languages?:Array<string>,
	 * first?:number,
	 * before?:string,
	 * after?:string,
	 * }} [params] **Paramètres de filtrage** :
	 * 
	 * • `users_names` : Les noms d'utilisateurs utilisés pour filtrer la liste des flux. Renvoie uniquement les flux des utilisateurs qui diffusent. Vous pouvez spécifier un maximum de 100 noms d'utilisateurs.  
	 * • `games_names` : Les noms des jeux (catégories) utilisés pour filtrer la liste des flux. Renvoie uniquement les flux qui diffusent les jeux (catégories). Vous pouvez spécifier un maximum de 100 noms.  
	 * • `type` : Type de flux par lequel filtrer la liste des flux. Par défaut : "all".  
	 * • `languages` : Un code de langue utilisé pour filtrer la liste des flux. Renvoie uniquement les flux diffusés dans la langue spécifiée. Spécifiez la langue à l'aide d'un code de langue à deux lettres ISO 639-1 ou autre si la diffusion utilise une langue ne figurant pas dans la liste des [langues de diffusion prises en charge](https://help.twitch.tv/s/article/linguals-on-twitch?langue=en_US#streamlang). Vous pouvez spécifier un maximum de 100 codes de langue.  
	 * • `first` : Nombre maximum d'éléments à renvoyer par page dans la réponse. La taille minimale de la page est de 1 élément par page et la taille maximale est de 100 éléments par page. La valeur par défaut est 20.  
	 * • `before` : Le curseur utilisé pour obtenir la page de résultats précédente. L'objet Pagination dans la réponse contient la valeur du curseur. [Lire la suite](https://dev.twitch.tv/docs/api/guide/#pagination)  
	 * • `after` : Le curseur utilisé pour obtenir la page suivante de résultats. L'objet Pagination dans la réponse contient la valeur du curseur. [Lire la suite](https://dev.twitch.tv/docs/api/guide/#pagination)  
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * error?:string,
	 * result?:Array<{
	 * id:string,
	 * user_id:string,
	 * user_login:string,
	 * user_name:string,
	 * game_id:string,
	 * game_name:string,
	 * type:"live"|"",
	 * title:string|"",
	 * tags:Array<string>,
	 * viewer_count:number,
	 * started_at:string,
	 * language:string,
	 * thumbnail_url:string,
	 * tag_ids:[],
	 * is_mature:boolean
	 * }>
	 * }>} **Renvoi une promesse d'objet** :
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la récupération des streams  
	 * • `result?` La liste des flux.  
	 * > • `id` Un identifiant qui identifie le flux. Vous pourrez utiliser cet identifiant ultérieurement pour rechercher la vidéo à la demande (VOD).  
	 * > • `user_id` L'ID de l'utilisateur qui diffuse le flux.  
	 * > • `user_login` Le nom de connexion de l'utilisateur.  
	 * > • `user_name` Le nom d'affichage de l'utilisateur.  
	 * > • `game_id` L'ID de la catégorie ou du jeu en cours de lecture.  
	 * > • `game_name` Le nom de la catégorie ou du jeu en cours.  
	 * > • `type` Le type de flux. Si une erreur se produit, ce champ est défini sur une chaîne vide.  
	 * > • `title` Le titre du flux. Est une chaîne vide si elle n'est pas définie.  
	 * > • `tags` Les balises appliquées au flux.  
	 * > • `viewer_count` Le nombre d'utilisateurs regardant le flux.  
	 * > • `started_at` La date et l'heure UTC (au format RFC3339) du début de la diffusion.  
	 * > • `langue` La langue utilisée par le flux. Il s'agit d'un code de langue à deux lettres ISO 639-1 ou autre si le flux utilise une langue qui ne figure pas dans la liste des [langues de flux prises en charge](https://help.twitch.tv/s/article/linguals-on-twitch?langue=en_US#streamlang).  
	 * > • `thumbnail_url` Une URL vers une image d'une image des 5 dernières minutes du flux. Remplacez les espaces réservés de largeur et de hauteur dans l'URL (**{width}x{height}**) par la taille de l'image souhaitée, en pixels.  
	 * > • `tag_ids` **IMPORTANT** Depuis le 28 février 2023, ce champ est obsolète et renvoie uniquement un tableau vide.  
	 * > • `is_mature` Une valeur booléenne qui indique si le flux est destiné à un public adulte.
	 * 
	 * ---
	 * @example
	 * client.getStreams().then(console.log); // Obtient des informations sur les 20 flux les plus actifs.
	 * 
	 * client.getStreams({
 		users_names:["twitchdev"]
	 }).then(console.log); // Obtient les flux pour les connexions spécifiées. Si l’utilisateur n’est pas en direct, la réponse ne l’inclut pas.
	 */
	async getStreams(params) {

		try {

			let link = `https://api.twitch.tv/helix/streams`;
			const linkParams = [];

			if (params) {

				if (params.after) {
					linkParams.push(`after=${params.after}`);
				}

				if (params.before) {
					linkParams.push(`before=${params.before}`);
				}

				if (params.first) {
					linkParams.push(`first=${params.first}`);
				}

				if (params.games_names) {
					const games = await this.getGames(params.games_names);
					if (!games.ok) {
						return { ok:false, error:games.error ?? games.statusText };
					}
					const ids = games.result.map(game => game.id);
					linkParams.push(`game_id=${ids.slice(0, 100).join('&game_id=')}`);
				}

				if (params.languages) {
					linkParams.push(`language=${params.languages.slice(0, 100).join('&language=')}`);
				}

				if (params.type) {
					linkParams.push(`type=${params.type}`);
				}

				if (params.users_names) {
					const users = await this.getUsers(params.users_names);
					if (!users.ok) {
						return { ok:false, error:users.error ?? users.statusText };
					}
					const userIds = users.result.map(user => user.id);
					linkParams.push(`user_id=${userIds.slice(0, 100).join('&user_id=')}`);
				}

			}

			if (this.isExpiredToken()) {
				await this.refreshToken();
			}

			link += "?" + linkParams.join("&");

			const _ = await fetch(link, {
				method:"GET",
				headers:{
					"Authorization":`${TwitchToken.token_type} ${TwitchToken.access_token}`,
					"Client-Id":this.clientId,
				},
			});

			if (!_.ok) {
				return { ok:false, statusText:_.statusText };
			}

			const result = await _.json();
			return { ok:true, result:result.data };

		}
		catch (error) {
			return { ok:false, error:error.stack };
		}
	}
	/**
	 * 👀 **Renvoi les informations d'un ou plusieurs utilisateur(s)**
	 * 
	 * ---
	 * @param {Array<string>} usernames Les noms d'utilisateur des utilisateurs à obtenir. Le nombre maximum de noms d'utilisateur que vous pouvez spécifier est de 100.
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * result?:Array<{
	 * id:string,
	 * display_name:string,
	 * broadcaster_type:""|"affiliate"|"partner",
	 * description:string,
	 * profile_image_url:string,
	 * offline_image_url:string,
	 * view_count:number,
	 * created_at:string
	 * }>
	 * }>} **Renvoi une promesse d'objet** :
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la récupération des utilisateurs  
	 * • `result?` La liste des utilisateurs.  
	 * > • `id` Un identifiant qui identifie l'utilisateur.  
	 * > • `login` Le nom d'affichage de l'utilisateur.  
	 * > • `type` Le type d'utilisateur.  
	 * > • `broadcaster_type` Le type de diffuseur.  
	 * > • `description` La description de l'utilisateur sur sa chaîne.  
	 * > • `profile_image_url` Une URL vers l'image de profil de l'utilisateur.  
	 * > • `offline_image_url` Une URL vers l'image hors ligne de l'utilisateur.  
	 * > • `view_count` **REMARQUE** : ce champ est obsolète (voir [Point de terminaison de l'API Get Users – Dépréciation de « view_count »)](https://discuss.dev.twitch.tv/t/get-users-api -endpoint-view-count-deprecation/37777)). Toutes les données contenues dans ce champ ne sont pas valides et ne doivent pas être utilisées.  
	 * > • `created_at` La date et l'heure UTC auxquelles le compte de l'utilisateur a été créé. L'horodatage est au format RFC3339.
	 * 
	 * ---
	 * @example
	 client.getUsers(["twitchdev"]).then(console.log);
	 */
	async getUsers(usernames) {

		try {

			const map = usernames.splice(0, 100).join('&login=');
			const link = `https://api.twitch.tv/helix/users?login=${map}`;
	
			if (this.isExpiredToken()) {
				await this.refreshToken();
			}
	
			const _ = await fetch(link, {
				method:"GET",
				headers:{
					"Authorization":`${TwitchToken.token_type} ${TwitchToken.access_token}`,
					"Client-Id":this.clientId,
				},
			});
	
			if (!_.ok) {
				return { ok:false, statusText:_.statusText };
			}
	
			const result = await _.json();
			return { ok:true, result:result.data };

		}
		catch (error) {
			return { ok:false, error:error.stack };
		}

	}
	/**
	 * 👀 **Renvoi une liste de Cheermotes que les utilisateurs peuvent utiliser pour encourager Bits dans la salle de discussion de n'importe quelle chaîne compatible Bits.**  
	 * 💡 **Note** : Les cheermotes sont des émoticônes animées auxquelles les spectateurs peuvent attribuer des Bits.
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * error?:string,
	 * result?:Array<{
	 * prefix:string,
	 * tiers:Array<{
	 * min_bits:number,
	 * id:"1"|"100"|"500"|"1000"|"5000"|"10000"|"100000",
	 * color:string,
	 * images:{
	 * dark:{
	 * animated:{
	 * "1":string,
	 * "1.5":string,
	 * "2":string,
	 * "3":string,
	 * "4":string,
	 * },
	 * static:{
	 * "1":string,
	 * "1.5":string,
	 * "2":string,
	 * "3":string,
	 * "4":string,
	 * },
	 * },
	 * light:{
	 * animated:{
	 * "1":string,
	 * "1.5":string,
	 * "2":string,
	 * "3":string,
	 * "4":string,
	 * },
	 * static:{
	 * "1":string,
	 * "1.5":string,
	 * "2":string,
	 * "3":string,
	 * "4":string,
	 * },
	 * },
	 * },
	 * can_cheer:boolean,
	 * show_in_bits_card:boolean,
	 * }>,
	 * type:"global_first_party"|"global_third_party"|"channel_custom"|"display_only"|"sponsored",
	 * order:number,
	 * last_updated:string,
	 * is_charitable:boolean,
	 * }>
	 * }>} **Renvoi une promesse d'objet** :  
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la récupération des cheermotes  
	 * • `result ?` La liste des Cheermotes. La liste est classée par ordre croissant de la valeur du champ de commande.  
	 * > • `prefix` La partie nom de la chaîne Cheermote que vous utilisez dans le chat pour encourager Bits. La chaîne Cheermote complète est la concaténation de {préfixe} + {nombre de bits}. Par exemple, si le préfixe est « Cheer » et que vous souhaitez encourager 100 bits, la chaîne Cheermote complète est Cheer100. Lorsque la chaîne Cheermote est saisie dans le chat, Twitch la convertit en l'image associée au niveau Bits qui a été acclamé.  
	 * > • `tiers`  
	 * > > • `min_bits` Le nombre minimum de Bits que vous devez encourager à ce niveau. Le nombre maximum de Bits que vous pouvez encourager à ce niveau est déterminé par le nombre minimum de Bits requis du niveau suivant moins 1. Par exemple, si min_bits est 1 et min_bits pour le niveau suivant est 100, la plage de Bits pour ce niveau. est compris entre 1 et 99. La valeur minimale de bits du dernier niveau est le nombre maximum de bits que vous pouvez encourager en utilisant ce Cheermote. Par exemple, 10 000.  
	 * > > • `id` Le niveau.  
	 * > > • `color` Le code hexadécimal de la couleur associée à ce niveau (par exemple, #979797).  
	 * > > • `images` Les ensembles d'images animées et statiques pour le Cheermote. Le dictionnaire d'images est organisé par thème, format et taille. Les touches de thème sont sombres et claires. Chaque thème est un dictionnaire de formats : animés et statiques. Chaque format est un dictionnaire de tailles : 1, 1,5, 2, 3 et 4. La valeur de chaque taille contient l'URL de l'image.  
	 * > > • `can_cheer` Une valeur booléenne qui détermine si les utilisateurs peuvent encourager à ce niveau.  
	 * > > • `show_in_bits_card` Une valeur booléenne qui détermine si ce niveau est affiché dans la carte Bits. Est vrai si ce niveau est affiché dans la carte Bits.  
	 *
	 * > • `type` Le type de Cheermote.  
	 * > • `order` L'ordre dans lequel les Cheermotes sont affichés dans la carte Bits. Les numéros ne peuvent pas être consécutifs. Par exemple, les nombres peuvent passer de 1 à 7 puis à 13. Les numéros de commande sont uniques au sein d'un type de Cheermote (par exemple, global_first_party) mais peuvent ne pas être uniques parmi tous les Cheermotes de la réponse.  
	 * > • `last_updated` La date et l'heure, au format RFC3339, de la dernière mise à jour de ce Cheermote.  
	 * > • `is_charitable` Une valeur booléenne qui indique si ce Cheermote fournit une contribution caritative lors des campagnes caritatives. 
	 * 
	 * ---
	 * @example
	 client.getCheermotes().then(console.log);
	 */
	async getCheermotes() {
		
		try {

			const link = "https://api.twitch.tv/helix/bits/cheermotes";

			if (this.isExpiredToken()) {
				await this.refreshToken();
			}

			const _ = await fetch(link, {
				method:"GET",
				headers:{
					"Authorization":`${TwitchToken.token_type} ${TwitchToken.access_token}`,
					"Client-Id":this.clientId,
				},
			});

			if (!_.ok) {
				return { ok:false, statusText:_.statusText };
			}

			const result = await _.json();
			return { ok:true, result:result.data };

		}
		catch (error) {
			return { ok:false, error:error.stack };
		}

	}
	/**
	 * 👀 **Obtient la liste des [émotes globales](https://www.twitch.tv/creatorcamp/fr-fr/paths/getting-started-on-twitch/emotes/) ou la liste des émotes personnalisées du diffuseur.**  
	 * 💡 **Note** : Les émotes globales sont des émoticônes créées par Twitch que les utilisateurs peuvent utiliser dans n'importe quel chat Twitch.  
	 * Les diffuseurs créent ces émotes personnalisées pour les utilisateurs qui s'abonnent ou suivent la chaîne ou encouragent Bits dans la fenêtre de discussion de la chaîne. [En savoir plus](https://dev.twitch.tv/docs/irc/emotes/).  
	 * 💡 **Note** : À l'exception des émoticônes personnalisées, les utilisateurs peuvent utiliser des émoticônes personnalisées dans n'importe quel chat Twitch.
	 * 
	 * ---
	 * @param {string} [username] Le nom d'utilisateur qui identifie le diffuseur dont vous souhaitez obtenir les émoticônes.
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * error?:string,
	 * result?:Array<{
	 * id:string,
	 * name:string,
	 * images:{
	 * url_1x:string,
	 * url_2x:string,
	 * url_4x:string,
	 * },
	 * tier?:string,
	 * emote_type?:"bitstier"|"follower"|"subscriptions",
	 * emote_set_id?:string,
	 * format:Array<"static"|"animated">,
	 * scale:Array<"1.0"|"2.0"|"3.0">,
	 * theme_mode:Array<"dark"|"light">,
	 * template:string,
	 * }>
	 * }>} **Renvoi une promesse d'objet** :
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la récupération des emotes  
	 * • `result?` La liste des émoticônes globales. ou la liste des émoticônes créées par le diffuseur spécifié. Si le diffuseur n’a pas créé d’émoticônes personnalisées, la liste est vide.  
	 * > • `id` Un identifiant qui identifie cette emote.  
	 * > • `name` Le nom de l'emote. Il s'agit du nom que les téléspectateurs saisissent dans la fenêtre de discussion pour faire apparaître l'émote.  
	 * > • `images` Les URL des images pour l'emote. Ces URL d’images fournissent toujours une image d’émoticône statique et non animée avec un arrière-plan clair. **Note** : Vous devez utiliser l'URL modélisée dans le champ du modèle pour récupérer l'image au lieu d'utiliser ces URL.  
	 * > > • `url_1x` Une URL vers la petite version (28px x 28px) de l'emote.  
	 * > > • `url_2x` Une URL vers la version moyenne (56px x 56px) de l'emote.  
	 * > > • `url_4x` Une URL vers la grande version (112px x 112px) de l'emote.  
	 *
	 * > • `tier?` Le niveau d'abonné auquel l'emote est déverrouillée. Ce champ contient les informations de niveau uniquement si emote_type est défini sur abonnements, sinon il s'agit d'une chaîne vide.  
	 * > • `emote_type?` Le type d'emote.  
	 * > • `emote_set_id?` Un identifiant qui identifie l'ensemble d'émotes auquel appartient l'émote.  
	 * > • `format` Les formats dans lesquels l'émote est disponible. Par exemple, si l'émote est disponible uniquement au format PNG statique, le tableau ne contient que du statique. Mais si l'emote est disponible sous forme de PNG statique et de GIF animé, le tableau contient des éléments statiques et animés.  
	 * > • `scale` Les tailles dans lesquelles l'emote est disponible. Par exemple, si l'emote est disponible en petites et moyennes tailles, le tableau contient 1.0 et 2.0.  
	 * > • `theme_mode` Les thèmes d'arrière-plan dans lesquels l'emote est disponible.  
	 * > • `template` Une URL basée sur un modèle. Utilisez les valeurs des champs id, format, scale et theme_mode pour remplacer les chaînes d'espace réservé de même nom dans l'URL modélisée afin de créer une URL CDN (réseau de diffusion de contenu) que vous utilisez pour récupérer l'emote. Pour plus d'informations sur l'apparence du modèle et comment l'utiliser pour récupérer des émoticônes, consultez [Format d'URL Emote CDN](https://dev.twitch.tv/docs/irc/emotes/#cdn-template). Vous devez utiliser ce modèle au lieu d'utiliser les URL dans l'objet images.
	 * 
	 * ---
	 * @example
	 client.getChatEmotes().then(console.log); // Obtient toutes les émoticônes globales.
	 client.getChatEmotes("twitchdev").then(console.log); // Obtient les émoticônes personnalisées créées par la chaîne TwitchDev.
	 */
	async getChatEmotes(username) {

		try {

			let link = `https://api.twitch.tv/helix/chat/emotes/global`;

			if (username) {

				const user = await this.getUsers([username]);

				if (!user.ok) {
					return { ok:false, error:user.error ?? user.statusText };
				}

				const broadcaster_id = user.result[0]?.id;

				link = `https://api.twitch.tv/helix/chat/emotes/?broadcaster_id=${broadcaster_id}`;

			}

			if (this.isExpiredToken()) {
				await this.refreshToken();
			}

			const _ = await fetch(link, {
				method:"GET",
				headers:{
					"Authorization":`${TwitchToken.token_type} ${TwitchToken.access_token}`,
					"Client-Id":this.clientId,
				},
			});

			if (!_.ok) {
				return { ok:false, statusText:_.statusText };
			}

			const result = await _.json();
			return { ok:true, result:result.data };

		}
		catch (error) {
			return { ok:false, error:error.stack };
		}

	}
	/**
	 * 👀 **Obtient la liste des badges de discussion de Twitch, que les utilisateurs peuvent utiliser dans la salle de discussion de n'importe quelle chaîne, ou la liste des badges de discussion personnalisés du diffuseur.**  
	 * 💡 **Note** : Pour plus d'informations sur les badges de chat, consultez le [Guide des badges de chat Twitch](https://help.twitch.tv/s/article/twitch-chat-badges-guide?langue=en_US).  
	 * 💡 **Note** : La liste est vide si le diffuseur n'a pas créé de badges de discussion personnalisés. Pour plus d'informations sur les badges personnalisés, consultez [badges d'abonné](https://help.twitch.tv/s/article/subscriber-badge-guide?langue=en_US) et [badges Bits](https://help.twitch. tv/s/article/custom-bit-badges-guide?langue=en_US).
	 * 
	 * ---
	 * @param {string} [username] Le nom d'utilisateur
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * error?:string,
	 * result?:Array<{
	 * set_id:string,
	 * versions:Array<{
	 * id:string,
	 * image_url_1x:string,
	 * image_url_2x:string,
	 * image_url_4x:string,
	 * title:string,
	 * description:string,
	 * click_action:string|null,
	 * click_url:string|null,
	 * }>
	 * }>
	 * }>} **Renvoi une promesse d'objet** :
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la récupération des badges  
	 * • `result?` La liste des badges de chat. La liste est triée par ordre croissant par set_id, et au sein d'un ensemble, la liste est triée par ordre croissant par id.  
	 * > • `set_id` Un identifiant qui identifie cet ensemble de badges de discussion. Par exemple, Bits ou Abonné.  
	 * > • `versions` La liste des badges de discussion dans cet ensemble.  
	 * > > • `id` Un identifiant qui identifie cette version du badge. L'ID peut être n'importe quelle valeur. Par exemple, pour Bits, l'ID correspond au niveau de Bits, mais pour World of Warcraft, il peut s'agir d'Alliance ou de Horde.  
	 * > > • `image_url_1x` Une URL vers la petite version (18px x 18px) du badge.  
	 * > > • `image_url_2x` Une URL vers la version moyenne (36px x 36px) du badge.  
	 * > > • `image_url_4x` Une URL vers la version grande (72px x 72px) du badge.  
	 * > > • `title` Le titre du badge.  
	 * > > • `description` La description du badge.  
	 * > > • `click_action` L'action à entreprendre en cliquant sur le badge. Défini sur null si aucune action n'est spécifiée.  
	 * > > • `click_url` L'URL vers laquelle accéder lorsque vous cliquez sur le badge. Défini sur null si aucune URL n'est spécifiée.
	 * 
	 * ---
	 * @example
	 client.getChatBadges().then(console.log); // Obtient la liste des badges de discussion globaux.
	 client.getChatBadges("twitchdev").then(console.log); // Obtenez la liste des badges de discussion personnalisés créés par la chaîne TwitchDev Twitch.
	 */
	async getChatBadges(username) {

		try {

			let link = `https://api.twitch.tv/helix/chat/badges/global`;

			if (username) {

				const user = await this.getUsers([username]);

				if (!user.ok) {
					return { ok:false, error:user.error ?? user.statusText };
				}

				const broadcaster_id = user.result[0]?.id;

				link = `https://api.twitch.tv/helix/chat/badges/?broadcaster_id=${broadcaster_id}`;

			}

			if (this.isExpiredToken()) {
				await this.refreshToken();
			}

			const _ = await fetch(link, {
				method:"GET",
				headers:{
					"Authorization":`${TwitchToken.token_type} ${TwitchToken.access_token}`,
					"Client-Id":this.clientId,
				},
			});

			if (!_.ok) {
				return { ok:false, statusText:_.statusText };
			}

			const result = await _.json();
			return { ok:true, result:result.data };

		}
		catch (error) {
			return { ok:false, error:error.stack };
		}

	}
	/**
	 * 👀 **Renvoi les paramètres de discussion du diffuseur**
	 * 
	 * ---
	 * @param {string} username Le nom d'utilisateur du diffuseur dont vous souhaitez obtenir les paramètres de discussion.
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * error?:string,
	 * result?:Array<{
	 * broadcaster_id:string,
	 * emote_mode:boolean,
	 * follower_mode:boolean,
	 * follower_mode_duration:number|null,
	 * slow_mode:boolean,
	 * slow_mode_wait_time:number|null,
	 * subscriber_mode:boolean,
	 * unique_chat_mode:boolean,
	 * }>
	 * }>} **Renvoi une promesse d'objet** :
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la récupération des paramètres  
	 * • `result?` La liste des paramètres de discussion. La liste contient un seul objet avec tous les paramètres.  
	 * > • `broadcaster_id` L'ID du diffuseur spécifié dans la requête.  
	 * > • `emote_mode` Une valeur booléenne qui détermine si les messages de discussion doivent contenir uniquement des émoticônes. Est vrai si les messages de discussion ne peuvent contenir que des émoticônes ; sinon, faux.  
	 * > • `follower_mode` Une valeur booléenne qui détermine si le diffuseur restreint la salle de discussion aux abonnés uniquement. Est vrai si le diffuseur restreint la salle de discussion aux abonnés uniquement ; sinon, faux. Consultez le champ follower_mode_duration pour connaître la durée pendant laquelle les utilisateurs doivent suivre le diffuseur avant de pouvoir participer au salon de discussion.  
	 * > • `follower_mode_duration` La durée, en minutes, pendant laquelle les utilisateurs doivent suivre le diffuseur avant de pouvoir participer au salon de discussion. Est nul si follower_mode est faux.  
	 * > • `slow_mode` Une valeur booléenne qui détermine si le diffuseur limite la fréquence à laquelle les utilisateurs de la salle de discussion sont autorisés à envoyer des messages. Est vrai si le diffuseur applique un délai ; sinon, faux. Voir le champ slow_mode_wait_time pour le délai.  
	 * > • `slow_mode_wait_time` Le temps, en secondes, pendant lequel les utilisateurs doivent attendre entre l'envoi de messages. Est nul si slow_mode est faux.  
	 * > • `subscriber_mode` Une valeur booléenne qui détermine si seuls les utilisateurs abonnés à la chaîne du diffuseur peuvent parler dans la salle de discussion. Est vrai si le diffuseur restreint le salon de discussion aux abonnés uniquement ; sinon, faux.  
	 * > • `unique_chat_mode` Une valeur booléenne qui détermine si le diffuseur demande aux utilisateurs de publier uniquement des messages uniques dans la salle de discussion. Est vrai si le diffuseur exige uniquement des messages uniques ; sinon, faux.
	 * 
	 * ---
	 * @example
	 client.getChatSettings("twitchdev").then(console.log);
	 */
	async getChatSettings(username) {

		try {

			const user = await this.getUsers([username]);

			if (!user.ok) {
				return { ok:false, error:user.error ?? user.statusText };
			}

			const broadcaster_id = user.result[0]?.id;

			const link = `https://api.twitch.tv/helix/chat/settings/?broadcaster_id=${broadcaster_id}`;

			if (this.isExpiredToken()) {
				await this.refreshToken();
			}

			const _ = await fetch(link, {
				method:"GET",
				headers:{
					"Authorization":`${TwitchToken.token_type} ${TwitchToken.access_token}`,
					"Client-Id":this.clientId,
				},
			});

			if (!_.ok) {
				return { ok:false, statusText:_.statusText };
			}

			const result = await _.json();
			return { ok:true, result:result.data };

		}
		catch (error) {
			return { ok:false, error:error.stack };
		}

	}
	/**
	 * 👀 **Renvoi la couleur utilisée pour le nom de l'utilisateur dans le chat.**
	 * 
	 * ---
	 * @param {Array<string>} usernames L'ID de l'utilisateur dont vous souhaitez obtenir la couleur du nom d'utilisateur. L'API ignore les noms en double et les noms introuvables.
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * error?:string,
	 * result?:Array<{
	 * user_id:string,
	 * user_name:string,
	 * user_login:string,
	 * color:string,
	 * }>
	 * }>} **Renvoi une promesse d'objet** :
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la récupération des couleurs  
	 * • `result?` La liste des utilisateurs et le code couleur qu'ils utilisent pour leur nom.  
	 * > • `user_id` Un identifiant qui identifie de manière unique l'utilisateur.  
	 * > • `user_login` Le nom de connexion de l'utilisateur.  
	 * > • `user_name` Le nom d'affichage de l'utilisateur.  
	 * > • `color` Le code couleur hexadécimal que l'utilisateur utilise dans le chat pour son nom. Si l'utilisateur n'a pas spécifié de couleur dans ses paramètres, la chaîne est vide.
	 * 
	 * ---
	 * @example
	 client.getUsersChatColor(["twitchdev"]).then(console.log);
	 */
	async getUsersChatColor(usernames) {

		try {

			const users = await this.getUsers(usernames);

			if (!users.ok) {
				return { ok:false, error:users.error ?? users.statusText };
			}

			const ids = users.result.map(user => user.id);

			const map = ids.join('&user_id=');
			const link = `https://api.twitch.tv/helix/chat/color?user_id=${map}`;

			if (this.isExpiredToken()) {
				await this.refreshToken();
			}

			const _ = await fetch(link, {
				method:"GET",
				headers:{
					"Authorization":`${TwitchToken.token_type} ${TwitchToken.access_token}`,
					"Client-Id":this.clientId,
				},
			});

			if (!_.ok) {
				return { ok:false, statusText:_.statusText };
			}

			const result = await _.json();
			return { ok:true, result:result.data };

		}
		catch (error) {
			return { ok:false, error:error.stack };
		}

	}
	/**
	 * 👀 **Obtient un ou plusieurs clips vidéo capturés à partir de flux**  
	 * 💡 **Note** : Pour plus d'informations sur les clips, consultez [Comment utiliser les clips](https://help.twitch.tv/s/article/how-to-use-clips?langage=en_US).
	 * 
	 * ---
	 * @param {string} username Un nom d'utilisateur qui identifie le diffuseur dont vous souhaitez obtenir les clips vidéo. Utilisez ce paramètre pour obtenir des clips capturés à partir des flux du diffuseur.
	 * 
	 * ---
	 * @param {{
	 * started_at?:string,
	 * ended_at?:string,
	 * first?:number,
	 * before?:string,
	 * after?:string
	 * }} [params] **Paramètres de filtrage** :
	 * 
	 * • `started_at?` La date de début utilisée pour filtrer les clips. L'API renvoie uniquement les clips situés dans la fenêtre de date de début et de fin. Spécifiez la date et l'heure au format RFC3339.  
	 * • `ended_at?` La date de fin utilisée pour filtrer les clips. Si elle n’est pas spécifiée, la fenêtre horaire correspond à la date de début plus une semaine. Spécifiez la date et l'heure au format RFC3339.  
	 * • `first?` Le nombre maximum de clips à renvoyer par page dans la réponse. La taille de page minimale est de 1 clip par page et la taille maximale est de 100. La valeur par défaut est de 20.  
	 * • `before ?` Le curseur utilisé pour obtenir la page de résultats précédente. L'objet Pagination dans la réponse contient la valeur du curseur. [Lire la suite](https://dev.twitch.tv/docs/api/guide/#pagination)  
	 * • `after` Le curseur utilisé pour obtenir la page suivante de résultats. L'objet Pagination dans la réponse contient la valeur du curseur. [Lire la suite](https://dev.twitch.tv/docs/api/guide/#pagination)
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * error?:string,
	 * result?:Array<{
	 * id:string,
	 * url:string,
	 * embed_url:string,
	 * broadcaster_id:string,
	 * broadcaster_name:string,
	 * creator_id:string,
	 * creator_name:string,
	 * video_id:string,
	 * game_id:string,
	 * language:string,
	 * title:string,
	 * view_count:number,
	 * created_at:string,
	 * thumbnail_url:string,
	 * duration:number,
	 * vod_offset:number|null,
	 * }>
	 * }>} **Renvoi une promesse d'objet** :
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la récupération des clips  
	 * • `result?` La liste des clips vidéo. Pour les clips renvoyés par game_id ou Broadcaster_id, la liste est classée par ordre décroissant du nombre de vues. Pour les listes renvoyées par id, la liste est dans le même ordre que les ID d'entrée.  
	 * > • `id` Un identifiant qui identifie de manière unique le clip.  
	 * > • `url` Une URL vers le clip.  
	 * > • `embed_url` Une URL que vous pouvez utiliser dans une iframe pour intégrer le clip (voir [Intégration de vidéos et de clips](https://dev.twitch.tv/docs/embed/video-and-clips/)).  
	 * > • `broadcaster_id` Un identifiant qui identifie le diffuseur à partir duquel la vidéo a été extraite.  
	 * > • `broadcaster_name` Le nom d'affichage du diffuseur.  
	 * > • `creator_id` Un identifiant qui identifie l'utilisateur qui a créé le clip.  
	 * > • `creator_name` Le nom d'affichage de l'utilisateur.  
	 * > • `video_id` Un identifiant qui identifie la vidéo d'où provient le clip. Ce champ contient une chaîne vide si la vidéo n'est pas disponible.  
	 * > • `game_id` L'ID du jeu en cours de lecture lors de la création du clip.  
	 * > • `langue` Le code de langue à deux lettres ISO 639-1 dans lequel le diffuseur diffuse. Par exemple, en pour l'anglais. La valeur est différente si le diffuseur utilise une langue que Twitch ne prend pas en charge.  
	 * > • `title` Le titre du clip.  
	 * > • `view_count` Le nombre de fois que le clip a été visionné.  
	 * > • `created_at` La date et l'heure de création du clip. La date et l'heure sont au format RFC3339.  
	 * > • `thumbnail_url` Une URL vers une image miniature du clip.  
	 * > • `duration` La durée du clip, en secondes. La précision est de 0,1.  
	 * > • `vod_offset` Le décalage de base zéro, en secondes, par rapport à l'endroit où le clip commence dans la vidéo (VOD). Est nul si la vidéo n'est pas disponible ou n'a pas encore été créée à partir du flux en direct (voir video_id). Notez qu’il existe un délai entre le moment où un clip est créé lors d’une diffusion et le moment où le décalage est défini. Pendant la période de retard, vod_offset est nul. Le délai est indéterminé mais dure généralement quelques minutes.
	 * 
	 * ---
	 * @example
	 client.getClips("twitchdev").then(console.log);
	 */
	async getClips(username, params = {}) {

		try {

			const user = await this.getUsers([username]);

			if (!user.ok) {
				return { ok:false, error:user.error ?? user.statusText };
			}

			const broadcaster_id = user.result[0]?.id;

			let link = `https://api.twitch.tv/helix/clips?broadcaster_id=${broadcaster_id}`;
			const linkParams = [];

			if (params) {

				if (params.started_at) {
					linkParams.push(`started_at=${params.started_at}`);
				}
				if (params.ended_at) {
					linkParams.push(`ended_at=${params.ended_at}`);
				}
				if (params.after) {
					linkParams.push(`after=${params.after}`);
				}
				if (params.before) {
					linkParams.push(`before=${params.before}`);
				}
				if (params.first) {
					linkParams.push(`first=${params.first}`);
				}

			}

			if (this.isExpiredToken()) {
				await this.refreshToken();
			}

			link += "?" + linkParams.join("&");

			const _ = await fetch(link, {
				method:"GET",
				headers:{
					"Authorization":`${TwitchToken.token_type} ${TwitchToken.access_token}`,
					"Client-Id":this.clientId,
				},
			});

			if (!_.ok) {
				return { ok:false, statusText:_.statusText };
			}

			const result = await _.json();
			return { ok:true, result:result.data };

		}
		catch (error) {
			return { ok:false, error:error.stack };
		}

	}
	/**
	 * 👀 **Renvoi des informations sur toutes les diffusions sur Twitch**
	 * 
	 * ---
	 * @param {{
	* first?:number,
	* after?:string,
	* before?:string,
	* }} [params] **Paramètres de filtrage** :
	* 
	* > • `first?` Le nombre maximum d'éléments à renvoyer par page dans la réponse. La taille minimale de la page est de 1 élément par page et la taille maximale est de 100 éléments par page. La valeur par défaut est 20.  
	* > • `after?` Le curseur utilisé pour obtenir la page suivante de résultats. L'objet Pagination dans la réponse contient la valeur du curseur. [Lire la suite](https://dev.twitch.tv/docs/api/guide/#pagination)  
	* > • `before ?` Le curseur utilisé pour obtenir la page de résultats précédente. L'objet Pagination dans la réponse contient la valeur du curseur. [Lire la suite](https://dev.twitch.tv/docs/api/guide/#pagination)
	* 
	* ---
	* @returns {Promise<{
	* ok:boolean,
	* statusText?:string,
	* error?:string,
	* result?Array<{
	* id:string,
	* name:string,
	* box_art_url:string,
	* igdb_id:string
	* }>
	* }>} **Renvoi une promesse d'objet** :
	* 
	* • `ok` : État de la requête (true ou false)  
	* • `statusText?` : État de la requête (similaire à error)  
	* • `error?` : Erreur lors de la récupération des jeux  
	* • `result?` La liste des diffusions. Les émissions sont classées par nombre de téléspectateurs, les plus populaires en premier.  
	* > • `id` Un identifiant qui identifie la catégorie ou le jeu.  
	* > • `name` Le nom de la catégorie ou du jeu.  
	* > • `box_art_url` Une URL vers la pochette de la catégorie ou du jeu. Vous devez remplacer l'espace réservé {width}x{height} par la taille d'image souhaitée.  
	* > `igdb_id` L'ID que [IGDB](https://www.igdb.com) utilise pour identifier ce jeu. Si l'ID IGDB n'est pas disponible pour Twitch, ce champ est défini sur une chaîne vide.
	* 
	* ---
	* @example
	client.getTopGames().then(console.log);
	*/
	async getTopGames(params) {

		try {

			let link = `https://api.twitch.tv/helix/games/top`;
			const linkParams = [];

			if (params) {

				if (params.after) {
					linkParams.push(`after=${params.after}`);
				}
				if (params.before) {
					linkParams.push(`before=${params.before}`);
				}
				if (params.first) {
					linkParams.push(`first=${params.first}`);
				}

			}

			if (this.isExpiredToken()) {
				await this.refreshToken();
			}

			link += "?" + linkParams.join("&");

			const _ = await fetch(link, {
				method:"GET",
				headers:{
					"Authorization":`${TwitchToken.token_type} ${TwitchToken.access_token}`,
					"Client-Id":this.clientId,
				},
			});

			if (!_.ok) {
				return { ok:false, statusText:_.statusText };
			}

			const result = await _.json();
			return { ok:true, result:result.data };

		}
		catch (error) {
			return { ok:false, error:error.stack };
		}

	}
	/**
	 * 👀 **Renvoi des informations sur les catégories ou les jeux spécifiés.**  
	 * 💡 **Note** : Vous pouvez obtenir jusqu'à 100 catégories ou jeux en spécifiant leur identifiant ou leur nom. Vous pouvez spécifier tous les identifiants, tous les noms ou une combinaison d'identifiants et de noms. Si vous spécifiez une combinaison d'ID et de noms, le nombre total d'ID et de noms ne doit pas dépasser 100.
	 * 
	 * ---
	 * @param {Array<string>} gameNames Le nom de la catégorie ou du jeu à obtenir. Le nom doit correspondre exactement au titre de la catégorie ou du jeu. Incluez ce paramètre pour chaque catégorie ou jeu que vous souhaitez obtenir. Vous pouvez spécifier un maximum de 100 noms. Le point de terminaison ignore les noms en double et les noms introuvables.
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * error?:string,
	 * result?:Array<{
	 * id:string,
	 * name:string,
	 * box_art_url:string,
	 * igdb_id:string
	 * }>
	 * }>} **Renvoi une promesse d'objet** :
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la récupération des jeux  
	 * • `result?` La liste des catégories et des jeux. La liste est vide si les catégories et jeux spécifiés n’ont pas été trouvés.  
	 * > • `id` Un identifiant qui identifie la catégorie ou le jeu.  
	 * > • `name` Le nom de la catégorie ou du jeu.  
	 * > • `box_art_url` Une URL vers la pochette de la catégorie ou du jeu. Vous devez remplacer l'espace réservé {width}x{height} par la taille d'image souhaitée.  
	 * > • `igdb_id` L'ID que [IGDB](https://www.igdb.com) utilise pour identifier ce jeu. Si l'ID IGDB n'est pas disponible pour Twitch, ce champ est défini sur une chaîne vide.
	 * 
	 * ---
	 * @example
	 client.getGames(["Fortnite"]).then(console.log);
	 */
	async getGames(gameNames) {

		try {

			const map = gameNames.join('&name=');
			const link = `https://api.twitch.tv/helix/games?name=${map}`;

			if (this.isExpiredToken()) {
				await this.refreshToken();
			}

			const _ = await fetch(link, {
				method:"GET",
				headers:{
					"Authorization":`${TwitchToken.token_type} ${TwitchToken.access_token}`,
					"Client-Id":this.clientId,
				},
			});

			if (!_.ok) {
				return { ok:false, statusText:_.statusText };
			}

			const result = await _.json();
			return { ok:true, result:result.data };

		}
		catch (error) {
			return { ok:false, error:error.stack };
		}

	}
	/**
	 * 👀 **Obtient des informations sur une ou plusieurs vidéos publiées. Vous pouvez obtenir des vidéos par identifiant, par utilisateur ou par jeu/catégorie.**  
	 *  💡 **Note** : Vous pouvez appliquer plusieurs filtres pour obtenir un sous-ensemble de vidéos. Les filtres sont appliqués sous forme d’opération ET à chaque vidéo. Par exemple, si la langue est définie sur « de » et que game_id est défini sur 21779, la réponse inclut uniquement les vidéos montrant des utilisateurs jouant à League of Legends en allemand. Les filtres s'appliquent uniquement si vous obtenez des vidéos par ID utilisateur ou ID de jeu.
	 * 
	 * ---
	 * @param {string} username Le nom d'utilisateur de l'utilisateur dont vous souhaitez obtenir la liste des vidéos.
	 * 
	 * ---
	 * @param {{
	 * game_name?:string,
	 * language?:string,
	 * period?:"all"|"day"|"month"|"week",
	 * sort?:"time"|"trending"|"views",
	 * type?:"all"|"archive"|"highlight"|"upload",
	 * first?:number,
	 * after?:string,
	 * before?:string,
	 * }} [params] **Paramètres de filtrage** :
	 * 
	 * > • `game_name?` Un nom de catégorie ou de jeu. La réponse contient un maximum de 500 vidéos montrant ce contenu. Pour obtenir les noms de catégories/de jeux, utilisez le point de terminaison Rechercher des catégories.  
	 * > • `language?` Un filtre utilisé pour filtrer la liste des vidéos en fonction de la langue dans laquelle le propriétaire de la vidéo diffuse. Par exemple, pour obtenir des vidéos diffusées en allemand, définissez ce paramètre sur les deux lettres ISO 639-1. code pour l’allemand (c’est-à-dire DE). Pour obtenir la liste des langues prises en charge, consultez [Langues de flux prises en charge](https://help.twitch.tv/s/article/linguals-on-twitch?lingual=en_US#streamlang). Si la langue n’est pas prise en charge, utilisez « autre ». Spécifiez ce paramètre uniquement si vous spécifiez le paramètre de requête game_name.  
	 * > • `period?` Un filtre utilisé pour filtrer la liste des vidéos selon leur date de publication. Par exemple, les vidéos publiées la semaine dernière. La valeur par défaut est « tout », qui renvoie les vidéos publiées dans toutes les périodes.  
	 * > • `sort?` L'ordre dans lequel trier les vidéos renvoyées. La valeur par défaut est « heure ».  
	 * > • `type?` Un filtre utilisé pour filtrer la liste des vidéos par type de vidéo. La valeur par défaut est « all », qui renvoie tous les types de vidéo.  
	 * > • `first?` Le nombre maximum d'éléments à renvoyer par page dans la réponse. La taille minimale de la page est de 1 élément par page et la taille maximale est de 100. La valeur par défaut est de 20.  
	 * > • `after?` Le curseur utilisé pour obtenir la page suivante de résultats. L'objet Pagination dans la réponse contient la valeur du curseur. [Lire la suite](https://dev.twitch.tv/docs/api/guide/#pagination)  
	 * > • `before?` Le curseur utilisé pour obtenir la page de résultats précédente. L'objet Pagination dans la réponse contient la valeur du curseur. [Lire la suite](https://dev.twitch.tv/docs/api/guide/#pagination)
	 * 
	 * ---
	 * @returns {Promise<{
	 * ok:boolean,
	 * statusText?:string,
	 * error?:string,
	 * result?:Array<{
	 * id:string,
	 * stream_id:string,
	 * user_id:string,
	 * user_login:string,
	 * user_name:string,
	 * title:string,
	 * description:string,
	 * created_at:string,
	 * published_at:string,
	 * utl:string,
	 * thumbnail_url:string,
	 * viewable:string,
	 * view_count:number,
	 * language:string,
	 * type:"archive"|"highlight"|"upload",
	 * duration:string,
	 * muted_segments:Array<{
	 * duration:number,
	 * offset:number,
	 * }>|null,
	 * }>
	 * }>} **Renvoi une promesse d'objet** :
	 * 
	 * • `ok` : État de la requête (true ou false)  
	 * • `statusText?` : État de la requête (similaire à error)  
	 * • `error?` : Erreur lors de la récupération des vidéos  
	 * • `result?` La liste des vidéos publiées qui correspondent aux critères de filtre.  
	 * > • `id` Un identifiant qui identifie la vidéo.  
	 * > • `stream_id` L'ID du flux d'où provient la vidéo si le type de la vidéo est « archive » ; sinon, nul.  
	 * > • `user_id` L'ID du diffuseur propriétaire de la vidéo.  
	 * > • `user_login` Le nom de connexion du diffuseur.  
	 * > • `user_name` Le nom d'affichage du diffuseur.  
	 * > • `title` Le titre de la vidéo.  
	 * > • `description` La description de la vidéo.  
	 * > • `created_at` La date et l'heure, en UTC, de la création de la vidéo. L'horodatage est au format RFC3339.  
	 * > • `published_at` La date et l'heure, en UTC, de la publication de la vidéo. L'horodatage est au format RFC3339.  
	 * > • `url` L'URL de la vidéo.  
	 * > • `thumbnail_url` Une URL vers une image miniature de la vidéo. Avant d'utiliser l'URL, vous devez remplacer les espaces réservés %{width} et %{height} par la largeur et la hauteur de la vignette que vous souhaitez renvoyer. Spécifiez la largeur et la hauteur en pixels. Étant donné que le CDN conserve le rapport de la vignette, celle-ci peut ne pas avoir la taille exacte que vous avez demandée.  
	 * > • `visible` L'état visible de la vidéo. Toujours défini sur public.  
	 * > • `view_count` Le nombre de fois que les utilisateurs ont regardé la vidéo.  
	 * > • `langue` Le code de langue à deux lettres ISO 639-1 dans lequel la vidéo a été diffusée. Par exemple, le code de langue est DE si la vidéo a été diffusée en allemand. Pour obtenir la liste des langues prises en charge, consultez [Langues de flux prises en charge](https://help.twitch.tv/s/article/linguals-on-twitch?lingual=en_US#streamlang). La valeur de langue est « autre » si la vidéo a été diffusée dans une langue ne figurant pas dans la liste des langues prises en charge.  
	 * > • `type` Le type de la vidéo.  
	 * > • `durée` La durée de la vidéo au format de durée ISO 8601. Par exemple, 3 min 21 s représente 3 minutes 21 secondes.  
	 * > • `muted_segments` Les segments que la reconnaissance audio Twitch a désactivés ; sinon, nul.  
	 * > > • `duration` La durée du segment muet, en secondes.  
	 * > > • `offset` Le décalage, en secondes, depuis le début de la vidéo jusqu'à l'endroit où commence le segment coupé.
	 * 
	 * ---
	 * @example
	 client.getVideos("twitchdev").then(console.log);
	 */
	async getVideos(username, params = {}) {

		try {

			const user = await this.getUsers([username]);

			if (!user.ok) {
				return { ok:false, error:user.error ?? user.statusText };
			}

			const user_id = user.result[0]?.id;

			let link = `https://api.twitch.tv/helix/videos?user_id=${user_id}`;
			const linkParams = [];

			if (params) {

				if (params.after) {
					linkParams.push(`after=${params.after}`);
				}
				if (params.before) {
					linkParams.push(`before=${params.before}`);
				}
				if (params.first) {
					linkParams.push(`first=${params.first}`);
				}
				if (params.game_name) {
					const game = await this.getGames([params.game_name]);
					if (!game.ok) {
						return { ok:false, error:game.error ?? game.statusText };
					}
					const id = game.result[0].id;
					linkParams.push(`game_id=${id}`);
				}
				if (params.language) {
					linkParams.push(`language=${params.language}`);
				}
				if (params.period) {
					linkParams.push(`period=${params.period}`);
				}
				if (params.sort) {
					linkParams.push(`sort=${params.sort}`);
				}
				if (params.type) {
					linkParams.push(`type=${params.type}`);
				}

			}

			if (this.isExpiredToken()) {
				await this.refreshToken();
			}

			link += "?" + linkParams.join("&");

			const _ = await fetch(link, {
				method:"GET",
				headers:{
					"Authorization":`${TwitchToken.token_type} ${TwitchToken.access_token}`,
					"Client-Id":this.clientId,
				},
			});

			if (!_.ok) {
				return { ok:false, statusText:_.statusText };
			}

			const result = await _.json();
			return { ok:true, result:result.data };

		}

		catch (error) {
			return { ok:false, error:error.stack };
		}

	}

};
