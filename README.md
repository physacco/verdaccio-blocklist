# verdaccio-blocklist

[Verdaccio](https://verdaccio.org/) plugin for banning blacklisted users (or JSON Web Tokens) from accessing the service.

## Background

This plugin is created to address the following use cases:
1. Verdaccio uses JWT (JSON Web Tokens) for authentication, but does not have a way to revoke a token once it has been issued.
2. If a user's token is compromised, there is no way to prevent the attacker from using the token to access the service (except changing the server's secret key).
3. In an organization, when an employee leaves, his/her token should be revoked.
4. This plugin allows you to specify a list of blacklisted users (or tokens) that will be rejected by Verdaccio.

## Features

- Block users by username or JWT. Just add a line to the blocklist file if you want to block someone.
- Auto-reloading of blocklist files, no need to restart Verdaccio.
- Written in JavaScript, so it's easy to understand and modify. Contributions are welcome!

## Installation

If you are running Verdaccio from source code, then you can install this plugin by running:

```bash
npm install verdaccio-blocklist
```

If you are running Verdaccio with Docker (image `verdaccio/verdaccio`), you can also install this plugin as follows:
1. Create a config file for Verdaccio:
    1. Create a `conf` directory in your Verdaccio working directory
    2. Mount the `conf` directory as a volume in your Docker container, e.g. `-v ./conf:/verdaccio/conf`
    3. Create a `config.yaml` file in the `conf` directory with the following content:
        ```yaml
        plugins: /verdaccio/plugins
        ```
2. Create a directory for the plugin:
    1. Create a `plugins` directory in your Verdaccio working directory
    2. Mount the `plugins` directory as a volume in your Docker container, e.g. `-v ./plugins:/verdaccio/plugins`
3. Clone this repository into the `plugins` directory, e.g. `cd plugins && git clone https://github.com/physacco/verdaccio-blocklist`
4. Run the command: `cd verdaccio-blocklist && npm install`
5. Add the following to your `config.yaml`:
    ```yaml
    middlewares:
      blocklist:
        enabled: true
        user_list: /verdaccio/conf/blocked_user.txt
        jwt_list: /verdaccio/conf/blocked_jwt.txt
    ```

## Configuration

Configuration is done in Verdaccio's config file (e.g. `/verdaccio/conf/config.yaml`).

The plugin is configured under the `middlewares` section. Grammar:

```yaml
middlewares:
  blocklist:
    # If false, all authenticated users/JWTs are allowed to access
    enabled: true
    
    # Path to the file containing the list of blacklisted users
    # (one per line)
    user_list: /path/to/user_list.txt
    
    # Path to the file containing the list of blacklisted JWTs
    # (one per line)
    jwt_list: /path/to/jwt_list.txt
```

For example:

```yaml
middlewares:
  blocklist:
    enabled: true
    user_list: /verdaccio/conf/blocked_user.txt
    jwt_list: /verdaccio/conf/blocked_jwt.txt
```

Create the list files (`blocked_user.txt` and `blocked_jwt.txt`) in the `conf` directory, and add the users and JWTs you want to block, one per line.

The files specified by `user_list` and `jwt_list` will be read on startup and whenever they are modified. The plugin will automatically reload the lists. There is no need to restart Verdaccio.

## License

This project is licensed under the ISC license.
