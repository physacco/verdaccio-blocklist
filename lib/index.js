"use strict";

const fs = require('fs');
const express = require('express');
const { createVerifier } = require('fast-jwt');

class VerdaccioMiddlewarePlugin {
  constructor(config) {
    this.logger = config.logger;
  }

  register_middlewares(app, auth, _storage) {
    const blConfig = auth?.config?.middlewares?.blocklist;
    if (!blConfig?.enabled) {
      return;
    }

    this.logger.debug(`[middleware blocklist] the plugin is enabled`);

    const userList = [];
    this.loadListAndWatch(userList, blConfig.user_list);

    const jwtList = [];
    this.loadListAndWatch(jwtList, blConfig.jwt_list);

    const verify = createVerifier({ key: async () => auth.secret });

    app.use(async (req, res, next) => {
      const authHeader = req.headers['authorization'];
      if (authHeader?.indexOf) {
        const pos = authHeader.indexOf('Bearer');
        if (pos >= 0) {
          const token = authHeader.substr(pos + 7).trim();

          // check if the token is in the blocklist
          for (const jwt of jwtList) {
            if (token === jwt) {
              const message = `the token [${token}] is blocked`;
              this.logger.info(`[middleware blocklist] ${message}`);
              res.status(401);
              return next({message});
            }
          }

          // decode the token
          let decoded;

          try {
            decoded = await verify(token);
            this.logger.debug(`[middleware blocklist] token info: ${JSON.stringify(decoded)}`);
          } catch (err) {
            this.logger.error(`[middleware blocklist] token error: ${err}`);
          }

          // check if the user is in the blocklist
          if (decoded?.name) {
            for (let user of userList) {
              if (decoded.name === user) {
                const message = `the user [${user}] is blocked`;
                this.logger.info(`[middleware blocklist] ${message}`);
                res.status(403);
                return next({message});
              }
            }
          }
        }
      }

      await next();
    });
  }

  /**
   * Load a list file and watch for changes.
   * @param {string[]} list - the list to update
   * @param {string} filePath - the path to the file
   * @returns {void}
   */
  loadListAndWatch(array, filePath) {
    if (!filePath) {
      return;
    }

    const fn = async () => {
      try {
        const list = await this.loadListFile(filePath);
        array.length = 0;
        array.push(...list);
      } catch (err) {
        this.logger.error(`[middleware blocklist] failed to load list from [${filePath}]: ${err}`);
      }
    }

    fn();

    fs.watchFile(filePath, () => {
      this.logger.info(`[middleware blocklist] reloading list from [${filePath}]`);
      fn();
    });
  }

  /**
   * Load a text file and return an array of items.
   * Empty lines and blank lines are ignored.
   * Leading and trailing spaces are trimmed.
   * Lines starting with '#' are ignored.
   * @param {string} filePath - the path to the file
   * @returns {string[]} - the array of items
   */
  async loadListFile(filePath) {
    const text = await fs.promises.readFile(filePath, 'utf8');
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0).filter(line => !line.startsWith('#'));
    return lines;
  }
}

module.exports.default = VerdaccioMiddlewarePlugin;
