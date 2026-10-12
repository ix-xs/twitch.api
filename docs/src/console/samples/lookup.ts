import { Twitch } from "@ix-xs/twitch.api";

declare const clientId: string;
declare const clientSecret: string;
// ---
const twitch = new Twitch({ clientId, clientSecret });

const user = await twitch.users.getByLogin("twitchdev");
if (!user) throw new Error("No such user");

const [channel] = await twitch.channels.get({
  broadcaster_id: user.id,
});
const followers = await twitch.channels
  .followers({ broadcaster_id: user.id })
  .total();

console.log(channel?.title, followers);
