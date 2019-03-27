#!/usr/bin/env node

const yaml = require("js-yaml");
const fs = require("fs-extra");
const path = require("path");
const express = require("express");
const watch = require("node-watch");
const reload = require("reload");
const params = require("minimist")(process.argv.slice(2));

async function run() {
  try {
    const PORT = params.port || 8080;
    const ROOT_PATH = path.join(__dirname, params.path);
    const CONFIG_PATH = path.join(__dirname, params.path, "index.yaml");
    // Making sure the config exists
    await fs.access(CONFIG_PATH);

    const app = express();
    app.set("view engine", "ejs");
    app.set("port", PORT);
    app.use(express.static(ROOT_PATH));
    app.get("/", (_req, res) => {
      var config = yaml.safeLoad(fs.readFileSync(CONFIG_PATH, "utf8"));
      res.render(ROOT_PATH, { config, items: Object.values(config.items) });
    });
    // live reload
    reloadServer = reload(app);
    watch(ROOT_PATH, { recursive: true }, (evt, name) => {
      console.log("change", evt, name);
      reloadServer.reload();
    });
    app.listen(app.get("port"), () => {
      console.log(`Web server listening on port ${app.get("port")}`);
    });
  } catch (e) {
    console.error(e);
  }
}

run();
