import { Dropbox } from 'https://deno.land/x/dropbox@3.0.9/mod.ts';
import { load } from "https://deno.land/std@0.222.1/dotenv/mod.ts";
const env = await load();

const dropbox = new Dropbox({
    clientId: env.DROPBOX_CLIENT_ID,
    clientSecret: env.DROPBOX_CLIENT_SECRET,
});