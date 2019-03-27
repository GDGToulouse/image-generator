#!/usr/bin/env node

const yaml = require("js-yaml");
const fs = require("fs-extra");
const path = require("path");
const ejs = require("ejs");
const express = require("express");
const puppeteer = require("puppeteer");
const params = require("minimist")(process.argv.slice(2));

const flags = {
  chromeFlags: ["--headless"]
};

async function run() {
  try {
    const PORT = params.port || 8080;
    const ROOT_PATH = path.join(__dirname, params.path);
    const CONFIG_PATH = path.join(__dirname, params.path, "index.yaml");
    const DIST_PATH = path.join(__dirname, "dist", params.path);
    // Making sure the config exists
    await fs.access(CONFIG_PATH);
    await fs.ensureDir(DIST_PATH);

    var config = yaml.safeLoad(fs.readFileSync(CONFIG_PATH, "utf8"));

    const app = express();
    app.set("view engine", "ejs");
    app.set("port", PORT);
    app.use(express.static(ROOT_PATH));

    Object.entries(config.items).forEach(([name, itemConfig]) => {
      app.get(`/${name}`, (_req, res) => {
        // var config = yaml.safeLoad(fs.readFileSync(CONFIG_PATH, "utf8"));
        res.render(ROOT_PATH, { config, items: [itemConfig] });
      });
    });

    const server = app.listen(app.get("port"), async () => {
      console.log(`Web server listening on port ${app.get("port")}`);
    });

    let browser = await puppeteer.launch({
      headless: true,
      args: ["--hide-scrollbars"]
    });
    let page = await browser.newPage();

    await asyncForEach(
      Object.entries(config.items),
      async ([name, itemConfig]) => {
        await page.setViewport(config.viewport);
        await page.goto(`http://localhost:${app.get("port")}/${name}`);
        const imgPath = path.join(DIST_PATH, `${name}.jpg`);
        await page.screenshot({
          path: imgPath,
          type: config.screenshot.type || "jpeg",
          quality: config.screenshot.quality || 100
        });
        console.log(`Saved ${name}: ${imgPath}`)
      }
    );
    await page.close();
    await browser.close();
    server.close();
  } catch (e) {
    console.log(e);
  }
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

run();
