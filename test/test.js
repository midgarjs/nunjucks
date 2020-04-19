import { describe, it } from "mocha";
import chai from "chai";
import dirtyChai from "dirty-chai";
import chaiAsPromised from "chai-as-promised";
import path from "path";

/**
 * @type {Midgar}
 */
import Midgar from "@midgar/midgar";

import NunjucksPlugin from "../src/index.plugin";
import service from "../src/services/nunjucks.service";

const NunjucksService = service.service;

const expect = chai.expect;
chai.use(dirtyChai);
chai.use(chaiAsPromised);

const configPath = path.join(__dirname, "fixtures/config");
let mid = null;
const initMidgar = async () => {
  mid = new Midgar();
  await mid.start(configPath);
  return mid;
};

/**
 * Test the service
 */
describe("Nunjucks", function () {
  this.timeout(10000);

  before(async () => {
    await initMidgar();
  });
  after(async () => {
    await mid.stop();
  });

  /**
   * Test if the plugin is load
   */
  it("test plugin", async () => {
    const plugin = mid.pm.getPlugin("@midgar/nunjucks");
    expect(plugin).to.be.an.instanceof(
      NunjucksPlugin,
      "Plugin is not an instance of NunjucksPlugin"
    );

    const service = mid.getService("mid:nunjucks");
    expect(service).to.be.an.instanceof(
      NunjucksService,
      "Service is not an instance of NunjucksService"
    );
  });

  /**
   */
  it("render", async () => {
    const nunjucksService = mid.getService("mid:nunjucks");

    let html = await nunjucksService.render(
      "test-plugin:views/pages/test.html",
      { var: "nunjucks" }
    );

    expect(html).to.include("<title>Test</title>", "Missing title !");
    expect(html).to.include("<h1>test nunjucks</h1>", "Missing h1 !");

    html = await nunjucksService.render(
      "test-plugin:views/pages/test-rw.html",
      { var: "nunjucks" }
    );
    expect(html).to.include("<title>Test rw</title>", "Missing title !");
    expect(html).to.include("<h1>test rw nunjucks</h1>", "Missing h1 !");
  });
});
