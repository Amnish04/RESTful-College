class CredentialParser {
    constructor() {  /* No State, Utility Class */ }
    // Helper Functions
    #extractToken(record, delimeter) {
        let token = "", next_pos = 0;
        if (delimeter) {
            next_pos = record.indexOf(delimeter);
            token = record.substr(0, next_pos);
        }
        else {
            token = record;
        }
        return token;
    }
    
    // Driver Function
    parseDatabaseUrl(url) {
        let credentials = {};
        url = url.replace("postgres://", "");
        // Extract user
        credentials.user = this.#extractToken(url, ":");
        url = url.replace(credentials.user + ":", "");
        // Extract password
        credentials.password = this.#extractToken(url, "@");
        url = url.replace(credentials.password+"@", "");
        // Extract host
        credentials.host = this.#extractToken(url, ":");
        url = url.replace(credentials.host+":", "");
        // Extract port
        credentials.port = this.#extractToken(url, "/");
        url = url.replace(credentials.port+"/", "");
        // Extract Database Name
        credentials.database = this.#extractToken(url);
        return credentials;
    }
};

module.exports.urlParser = new CredentialParser();
