import { load } from "https://deno.land/std@0.222.1/dotenv/mod.ts";
const env = await load();

import { Dropbox } from "./mod.ts";

try {

    const dropbox = new Dropbox(env.DROPBOX_CLIENT_ID, env.DROPBOX_CLIENT_SECRET);

    const token = await dropbox.get_access_token(env.DROPBOX_REFRESH_TOKEN);
    console.log('token',token);

    const admin = await dropbox.get_authenticated_admin()
    console.log('admin',admin);

    // const folders = await dropbox.list_folders('',true, env.TEAM_MEMBER_ID, 'Admin');
    // console.log('folders',folders);

    // const namespaces = await dropbox.list_namespaces();
    // console.log('namespaces',namespaces);

} catch (error) {
    console.log(error.message)
}
