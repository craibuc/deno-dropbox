export class Dropbox {
    
    private client_id: string;
    private client_secret: string;
    private access_token: string;

    // public base_uri: string;

    constructor (client_id: string, client_secret: string) {
        this.client_id = client_id;
        this.client_secret = client_secret;

        // this.base_uri = `https://api.bamboohr.com/api/gateway.php/${subdomain}`;
    }

//#region auth

    get_access_token = async (
        refresh_token: string,
    ) => {

        const body = {
            grant_type: "refresh_token",
            refresh_token: refresh_token,
        }

        // const body = refresh_token
        // ? {
        //   grant_type: "refresh_token",
        //   refresh_token: refresh_token,
        // }
        // : {
        //   grant_type: "authorization_code",
        //   code: dropbox.access_code,
        // };
        // console.log("body", body);
    
        const formBody = Object.keys(body).map((key) =>
            encodeURIComponent(key) + "=" + encodeURIComponent(body[key])
        ).join("&");
        // console.log("formBody", formBody);
        
        // const credentials = btoa(`${this.client_id}:${this.client_secret}`);
        
        return await fetch("https://api.dropboxapi.com/oauth2/token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Basic ${ btoa(`${this.client_id}:${this.client_secret}`) }`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: formBody,
        })
        .then((response) => {
            if (!response.ok) {
                return Promise.reject(response);
            }
            return response.json();
        })
        .then((data) => {
            this.access_token = data.access_token;
            return data;
        })
        .catch((response) => {

            const response_status = `${response.statusText} [${response.status}]`;
            console.log(response_status);        
            const content_type = response.headers.get("content-type")

            if (content_type && content_type.indexOf("application/json") !== -1) {
                return response.json().then(data => {
                //   console.log('data',data)
                    throw new Error(`${response_status} - ${data.error_description}`)
                });
                } else {
                return response.text().then(text => {
                    console.log(text,text)
                    throw new Error(`${response_status} - ${text}`);
                });
            }
        });
    
    }

    get_authenticated_admin = async () => {
      
        return await fetch("https://api.dropboxapi.com/2/team/token/get_authenticated_admin", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.access_token}`,
                Accept: "application/json",
            },
        })
        .then((response) => {
            if (!response.ok) {
                if (response.status === 401) {
                    return null;
                } else {
                    return Promise.reject(response);
                }
            }
            return response.json();
        })
        .then((data) => data)
        .catch((response) => {
        
            const response_status = `${response.statusText} [${response.status}]`;
            // console.log(response_status);
            const content_type = response.headers.get("content-type");
    
            if (content_type && content_type.indexOf("application/json") !== -1) {
                return response.json().then((data) => {
                    console.log("data", data);
                    throw new Error(`${response_status} - ${data}`);
                });
            } else {
                return response.text().then((text) => {
                    console.log(text, text);
                    throw new Error(`${response_status} - ${text}`);
                });
            }
        });

    }
      
//#endregion

    delete_item = async (
        path: string,
    ) => {
    
        return await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.access_token}`,
            },
            body: JSON.stringify({
                path: path,
            }),
        })
        .then((response) => {
            if (!response.ok) {
                console.log("response", response);
                throw new Error(`${response.statusText} [${response.status}]`);
            }
            return response.json();
        })
        .then((data) => data);

    }

//#region folders

    list_folders = async (
        path: string,
        recursive: boolean,
        team_member_id: string,
        team_member_type: 'User' | 'Admin'
    ) => {
    
        let body: object = {
            path: path === "/" ? "" : path,
            recursive: recursive,
        };
    
        const headers: any = {
            Authorization: `Bearer ${this.access_token}`,
            'Content-Type': 'application/json',
        }
    
        if (team_member_id) {
            headers[`Dropbox-API-Select-${team_member_type}`] = team_member_id
        }
    
        let entries: Array<string> = [];
    
        let url = 'https://api.dropboxapi.com/2/files/list_folder';
        let proceed = false;
    
        try {
    
            do {
    
                const data = await fetch(url,{
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(body),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`${response.statusText} [${response.status}]`);
                    }
                    return response.json();
                });
    
                entries = entries.concat(data.entries);
    
                // next page of data
                url = "https://api.dropboxapi.com/2/files/list_folder/continue";
                body = { cursor: data.cursor };
                proceed = data.has_more;
    
            } while (proceed);
    
            return entries;
    
        }
        catch(e) {
            console.log(e)
        }
     
    }

    create_folder = async (
        path: string,
        autorename: boolean,
    ) => {
          
        return await fetch("https://api.dropboxapi.com/2/files/create_folder_v2", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                path: path,
                autorename: autorename,
            }),
        })
        .then((response) => {
            if (!response.ok) {
                console.log("response", response);
                throw new Error(`${response.statusText} [${response.status}]`);
            }
            return response.json();
        })
        .then((data) => data);

    }

    move_folder = async (
        from_path: string,
        to_path: string,
        autorename: boolean,
        allow_ownership_transfer: boolean,
    ) => {
        
        return await fetch("https://api.dropboxapi.com/2/files/move_v2", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.access_token}`,
            },
            body: JSON.stringify({
                from_path: from_path,
                to_path: to_path,
                autorename: autorename,
                allow_ownership_transfer: allow_ownership_transfer,
            }),
        })
        .then((response) => {
            if (!response.ok) {
                console.log("response", response);
                throw new Error(`${response.statusText} [${response.status}]`);
            }
            return response.json();
        })
        .then((data) => data);
    }

//#endregion

    list_namespaces = async (
        limit: number = 100,      
    ) => {

        let body: object = {
            limit: limit,
        };
    
        let namespaces: Array<string> = [];
        let url: string = "https://api.dropboxapi.com/2/team/namespaces/list";
        let proceed: boolean = false;
          
        try {
    
            do {
    
                const data = await fetch(url,{
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.access_token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`${response.statusText} [${response.status}]`);
                    }
                    return response.json();
                });
    
                namespaces = namespaces.concat(data.namespaces);
    
                // next page of data
                url = "https://api.dropboxapi.com/2/team/namespaces/continue";
                body = { cursor: data.cursor };
                proceed = data.has_more;
    
            } while (proceed);
    
            return namespaces;
    
        }
        catch(e) {
            console.log(e)
        }

    }

//#region files

    get_temporary_file_link = async (
        path: string,
    ) => {
    
        return await fetch("https://api.dropboxapi.com/2/files/get_temporary_link", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.access_token}`,
            },
            body: JSON.stringify({
                path: path,
            }),
        })
        .then((response) => {
            if (!response.ok) {
                console.log("response", response);
                throw new Error(`${response.statusText} [${response.status}]`);
            }
            return response.json();
        })
        .then((data) => data);

  }
  
    delete_file = async (
        path: string,
    ) => {

        return await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                path: path,
            }),
        })
        .then((response) => {
            if (!response.ok) {
                console.log("response", response);
                throw new Error(`${response.statusText} [${response.status}]`);
            }
            return response.json();
        })
        .then((data) => data);

    }
  
    download_file = async (
        pathSource: string,
        destinationPath: string,
    ) => {
      
        const headers = {
            Authorization: `Bearer ${this.access_token}`,
            "Dropbox-API-Arg": JSON.stringify({
                path: pathSource,
            }),
        };
        console.log("headers", headers);
      
        return await fetch("https://content.dropboxapi.com/2/files/download", {
            method: "POST",
            headers: headers,
        })
        .then((response) => {
            if (!response.ok) {
                console.log("response", response);
                throw new Error(`${response.statusText} [${response.status}]`);
            }
            return response.arrayBuffer();
        })
        .then((buffer) => {
            Deno.writeFile(destinationPath, new Uint8Array(buffer));
        })
        .catch((error) => {
            console.error("Error downloading file from Dropbox:", error);
        });
    
    }

    upload_file = async (
        sourcePath: string,
        targetDirectory: string,
        fileName: string,
        mode: "add" | "overwrite" | "update",
        autorename: boolean,
        root_folder_id: string,
        team_member_id: string,
        team_member_type: "User",
    ) => {

        console.log("sourcePath", sourcePath);
        console.log("targetDirectory", targetDirectory);
        console.log("fileName", fileName);
        console.log("root_folder_id", root_folder_id);
        console.log("team_member_id", team_member_id);
        console.log("team_member_type", team_member_type);
          
        const fileContent = await Deno.readFile(sourcePath);
        console.log("fileContent.length", fileContent.length);
        // console.log("fileContent", fileContent);
          
        const headers = {
            "Authorization": `Bearer ${this.access_token}`,
            "Content-Type": "application/octet-stream",
            "Dropbox-API-Arg": JSON.stringify({
                path: `${targetDirectory}/${fileName}`,
                mode: mode,
                autorename: autorename,
                strict_conflict: false,
                mute: false,
            }),
        };
          
        if (team_member_id) {
            headers[`Dropbox-API-Select-${team_member_type}`] = team_member_id;
        }
        
        if (root_folder_id) {
            headers["Dropbox-API-Path-Root"] = JSON.stringify({
            ".tag": "root",
            root: root_folder_id,
            });
        }
          
        console.log("headers", headers);
          
        return await fetch("https://content.dropboxapi.com/2/files/upload", {
            method: "POST",
            headers: headers,
            body: fileContent,
        })
        .then((response) => {
            if (!response.ok) {
                return Promise.reject(response);
            }
            return response.json();
        })
        .then((data) => data)
        .catch((response) => {
        
            const response_status = `${response.statusText} [${response.status}]`;
            console.log(response_status);
            const content_type = response.headers.get("content-type");
        
            if (content_type && content_type.indexOf("application/json") !== -1) {
                return response.json().then((data) => {
                console.log("data", data);
                throw new Error(`${response_status} - ${data}`);
                });
            } else {
                return response.text().then((text) => {
                console.log(text, text);
                throw new Error(`${response_status} - ${text}`);
                });
            }
        });
          
    }

//#endregion

}